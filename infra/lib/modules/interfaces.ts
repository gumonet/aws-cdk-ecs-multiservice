import { StackProps } from "aws-cdk-lib";
import { RestApiAttributes } from "aws-cdk-lib/aws-apigateway";
import { ISubnet } from "aws-cdk-lib/aws-ec2";
import { AwsLogDriver, ContainerImage, PortMapping } from "aws-cdk-lib/aws-ecs";
import { Protocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Role } from "aws-cdk-lib/aws-iam";

export interface infraProps extends StackProps {
  stage: string;
  vpcId: string;
  repositoryName: string;
  secretId: string;
  mainZappNLB: string;
  apiGateway: RestApiAttributes;
  vpcLinkId: string;
  subnetIds: string[];
}

export interface EcsServiceDefinitions {
  identifier_str: string;
  cpu: number;
  memoryLimitMiB: number;
  taskRole: Role;
  containers: ECSContainerProps[];
  subnets: { subnets: ISubnet[] };
}

export interface ECSContainerProps {
  containerName: string;
  ecrImage: ContainerImage;
  containerPorts: customPortMapping[];
  loggin: AwsLogDriver;
  secrets: {};
}
export interface customPortMapping {
  containerPort: number;
  listenerName: string;
  hostPort?: number;
  protocol?: Protocol;
}
