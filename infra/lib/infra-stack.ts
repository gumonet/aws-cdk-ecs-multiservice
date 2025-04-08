import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfraStackProps } from "./modules/interfaces";
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDriver,
} from "aws-cdk-lib/aws-ecs";
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EcsMiltiTask extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);
    const vpc = Vpc.fromLookup(this, "Vpc", {
      vpcId: props.vpcId,
    });
    const repository = Repository.fromRepositoryName(
      this,
      "EcrRepo",
      "example"
    );

    const cluster = new Cluster(this, "EcsCluster", {
      vpc,
      clusterName: `MultitaskCluster-${props.environment}`,
    });

    const taskDefinitionOne = new FargateTaskDefinition(this, "TaskDefOne");
    const taskDefinitionTwo = new FargateTaskDefinition(this, "TaskDefTwo");

    //Task definition for One
    taskDefinitionOne.addContainer("ContainerOne", {
      image: ContainerImage.fromEcrRepository(repository, "service-one"),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 80 }],
      logging: LogDriver.awsLogs({
        streamPrefix: `container-one-${props.environment}`,
        logGroup: new LogGroup(this, "LogGroupOne", {
          logGroupName: `/ecs/container-one-${props.environment}`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          retention: RetentionDays.ONE_WEEK,
        }),
      }),
    });

    //Task definition for Two
    taskDefinitionTwo.addContainer("ContainerTwo", {
      image: ContainerImage.fromEcrRepository(repository, "service-two"),
      memoryLimitMiB: 512,
      cpu: 256,
      portMappings: [{ containerPort: 80 }],
      logging: LogDriver.awsLogs({
        streamPrefix: `container-two-${props.environment}`,
        logGroup: new LogGroup(this, "LogGroupTwo", {
          logGroupName: `/ecs/container-two-${props.environment}`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          retention: RetentionDays.ONE_WEEK,
        }),
      }),
    });

    //General load balancer
    const lb = new ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
      loadBalancerName: `MultitaskALB-${props.environment}`,
    });

    //Listener for one
    const listener3000 = lb.addListener("ListenerOne", {
      port: 3000,
      open: true,
      protocol: ApplicationProtocol.HTTP,
    });

    //Listener for one
    const listener4000 = lb.addListener("ListenerTwo", {
      port: 4000,
      open: true,
      protocol: ApplicationProtocol.HTTP,
    });

    //TargetForGroup for one
    const targetOne = new ApplicationTargetGroup(this, "TargetGroupOne", {
      targetGroupName: `TargetGroupOne-${props.environment}`,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      vpc,
    });

    const targetTwo = new ApplicationTargetGroup(this, "TargetGroupTwo", {
      targetGroupName: `TargetGroupTwo-${props.environment}`,
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      vpc,
    });

    //Add listener to one for one target group
    listener3000.addTargetGroups("TargetGroupOne", {
      targetGroups: [targetOne],
    });

    listener4000.addTargetGroups("TargetGroupTwo", {
      targetGroups: [targetTwo],
    });

    //Create the ECS service
    const serviceOne = new FargateService(this, "ServiceOne", {
      cluster,
      taskDefinition: taskDefinitionOne,
      desiredCount: 1,
      serviceName: `ServiceOne-${props.environment}`,
    });

    //Create the ECS service two
    const serviceTwo = new FargateService(this, "ServiceTwo", {
      cluster,
      taskDefinition: taskDefinitionTwo,
      desiredCount: 1,
      serviceName: `ServicOTwo-${props.environment}`,
    });

    //Set new service to target group
    targetOne.addTarget(serviceOne);
    targetTwo.addTarget(serviceTwo);
    new cdk.CfnOutput(this, "ALB DNS", {
      value: lb.loadBalancerDnsName,
    });
  }
}
