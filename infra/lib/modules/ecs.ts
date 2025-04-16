import { ISubnet, IVpc, Peer, Port, SubnetType } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  FargateService,
  FargateTaskDefinition,
  ICluster,
} from "aws-cdk-lib/aws-ecs";
import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import {
  customPortMapping,
  ECSContainerProps,
  EcsServiceDefinitions,
} from "./interfaces";
import { containerMappingPorts, INFRA_STACK_PREFIX } from "./utils";
import { Protocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { stakLoadBalancer } from "./loadBalancer";

export class ECSDefinitions {
  public cluster: ICluster;
  private lbInstance: stakLoadBalancer;
  scope: Construct;
  stage: string;
  vpc: IVpc;
  constructor(
    scope: Construct,
    clusterName: string,
    vpc: IVpc,
    stage: string,
    loadBalancer: stakLoadBalancer
  ) {
    this.scope = scope;
    this.stage = stage;
    this.vpc = vpc;

    this.lbInstance = loadBalancer;
    this.cluster = this.getCluster(clusterName);
  }

  private getCluster(clusterName: string) {
    return Cluster.fromClusterAttributes(
      this.scope,
      `${INFRA_STACK_PREFIX}MainCluster`,
      {
        clusterName: clusterName,
        vpc: this.vpc,
      }
    );
  }

  public addServiceDefinition(props: EcsServiceDefinitions) {
    const taskDefinition = this.addTaskDefinition(
      props.cpu,
      props.memoryLimitMiB,
      props.taskRole
    );
    const service = this.createEcsService(
      taskDefinition,
      props.subnets,
      `${props.identifier_str}`
    );

    //Generate code to add container to each propts.containers
    props.containers.forEach((container) => {
      const id = taskDefinition.node.id;
      this.addContainer(id, taskDefinition, container);
      container.containerPorts.forEach((containerPort) => {
        this.addNetworkConfiguration(
          container.containerName,
          containerPort,
          service
        );
      });
    });
  }

  private createEcsService(
    taskDefinition: FargateTaskDefinition,
    subnets: { subnets: ISubnet[] },
    serviceName: string
  ) {
    return new FargateService(
      this.scope,
      `${INFRA_STACK_PREFIX}FargateService`,
      {
        cluster: this.cluster,
        taskDefinition: taskDefinition,
        desiredCount: 1,
        serviceName: serviceName,
        assignPublicIp: false,
        vpcSubnets: subnets,
      }
    );
  }

  private addTaskDefinition(
    cpu: number,
    memoryLimitMiB: number,
    taskRole: Role
  ) {
    return new FargateTaskDefinition(
      this.scope,
      `${INFRA_STACK_PREFIX}FargateDefinition`,
      {
        cpu: cpu,
        memoryLimitMiB: memoryLimitMiB,
        executionRole: taskRole,
      }
    );
  }
  private addContainer(
    id: string,
    taskDefinition: FargateTaskDefinition,
    props: ECSContainerProps
  ) {
    //Convert containerports to array of PortMapping
    const containerPorts = containerMappingPorts(props.containerPorts);
    return taskDefinition.addContainer(`${INFRA_STACK_PREFIX}Container${id}`, {
      image: props.ecrImage,
      containerName: props.containerName,
      portMappings: containerPorts,
      logging: props.loggin,
      secrets: props.secrets,
    });
  }

  private addNetworkConfiguration(
    containerName: string,
    containerPort: customPortMapping,
    service: FargateService
  ) {
    const listener = this.lbInstance.addListenerPort(
      `${INFRA_STACK_PREFIX}Listener${containerPort.listenerName}`,
      containerPort.containerPort,
      Protocol.TCP
    );
    const targetGroup = this.lbInstance.addTargetGroup(
      listener,
      `${INFRA_STACK_PREFIX}TargetFroup${containerPort.listenerName}`,
      containerPort.containerPort,
      Protocol.TCP,
      `${containerName}-${containerPort.listenerName}`,
      service.loadBalancerTarget({
        containerName: containerName,
        containerPort: containerPort.containerPort,
      })
    );
    //Allow traffic to this port for all vpc
    service.connections.allowFrom(
      Peer.ipv4(this.vpc.vpcCidrBlock),
      Port.tcp(containerPort.containerPort),
      `Allow traffic from VPC to service in por ${containerPort.containerPort}`
    );
  }
}
