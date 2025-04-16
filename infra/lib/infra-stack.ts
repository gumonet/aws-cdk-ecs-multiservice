import * as cdk from "aws-cdk-lib";
import { ContainerImage, Secret } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import {
  createLogginDriver,
  getImageFromRepository,
  getSecret,
  getTaskRole,
  getVPC,
  selectSubnetsById,
} from "./modules/utils";
import { ECSDefinitions } from "./modules/ecs";
import { infraProps } from "./modules/interfaces";
import { ApiGatewayConfiguration } from "./modules/apiGateway";
import { stakLoadBalancer } from "./modules/loadBalancer";

export class ZappDemoHttpServer extends cdk.Stack {
  constructor(scope: Construct, id: string, props: infraProps) {
    super(scope, id, props);

    const memoryLimitMiB = 1024;
    const cpu = 512;

    const taskRole = getTaskRole(this);

    /*const tagName = new cdk.CfnParameter(this, "tagName", {
      type: "String",
      description: "Tue name of the tag in the ECR repo to be deployed",
    });*/

    const secret = getSecret(this, props.secretId, this.region, this.account);
    secret.grantRead(taskRole);

    const vpc = getVPC(this, props.vpcId);
    const stackLoaBalancerInstance = new stakLoadBalancer(
      this,
      vpc,
      this.region,
      this.account,
      props.mainZappNLB
    );
    const ecsIntance = new ECSDefinitions(
      this,
      `ZappMainCluster-${props.stage}`,
      vpc,
      props.stage,
      stackLoaBalancerInstance
    );

    //GetImageFromECR
    /*const image = getImageFromRepository(
      this,
      props.repositoryName,
      tagName.valueAsString
    );*/
    const subnets = selectSubnetsById(this, props.subnetIds);

    ecsIntance.addServiceDefinition({
      identifier_str: `demo-http-${props.stage}`,
      cpu: cpu,
      memoryLimitMiB: memoryLimitMiB,
      taskRole: taskRole,
      subnets: subnets,
      containers: [
        {
          containerName: `demo-http-${props.stage}`,
          ecrImage: ContainerImage.fromRegistry("nginx:latest"),
          containerPorts: [{ containerPort: 80, listenerName: "HTTP" }],
          loggin: createLogginDriver(
            this,
            `demo-http-${props.stage}`,
            props.stage
          ),
          secrets: {},
        },
      ],
    });

    /*new ApiGatewayConfiguration(
      this,
      props.apiGateway,
      props.vpcLinkId,
      stackLoaBalancerInstance.getLoadBalancerObject(),
      props.stage
    );*/
  }
}
