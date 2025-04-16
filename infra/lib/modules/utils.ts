import { IVpc, Subnet, Vpc } from "aws-cdk-lib/aws-ec2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { AwsLogDriver, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { Role, ServicePrincipal, ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { customPortMapping } from "./interfaces";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { RemovalPolicy } from "aws-cdk-lib";

export const INFRA_STACK_PREFIX = "ZappCoresUnirOperations";

export const getTaskRole = (scope: Construct) => {
  return new Role(scope, `${INFRA_STACK_PREFIX}Role`, {
    assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    managedPolicies: [
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      ),
    ],
  });
};

export const getSecret = (
  scope: Construct,
  secretId: string,
  region: string,
  account: string
) => {
  return Secret.fromSecretCompleteArn(
    scope,
    "secret",
    `arn:aws:secretsmanager:${region}:${account}:secret:${secretId}`
  );
};

export const getVPC = (scope: Construct, vpcId: string) => {
  return Vpc.fromLookup(scope, "vpc", {
    vpcId: vpcId,
  });
};

export const getImageFromRepository = (
  scope: Construct,
  repositoryName: string,
  imageTag: string
) => {
  return ContainerImage.fromEcrRepository(
    Repository.fromRepositoryName(scope, "EcrRepo", repositoryName),
    imageTag
  );
};

export const createLogginDriver = (
  scope: Construct,
  name: string,
  stage: string
) => {
  return new AwsLogDriver({
    streamPrefix: name,
    logGroup: new LogGroup(scope, "LogGrop", {
      logGroupName: `${name}/ecs/`,
      retention:
        stage == "dev" ? RetentionDays.FIVE_DAYS : RetentionDays.THREE_MONTHS,
      removalPolicy:
        stage == "dev" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
    }),
  });
};

export const containerMappingPorts = (containerPorts: customPortMapping[]) => {
  return containerPorts.map((port) => {
    const portMapping: any = { containerPort: port.containerPort };
    if (port.hostPort !== undefined) {
      portMapping.hostPort = port.hostPort;
    }
    if (port.protocol !== undefined) {
      portMapping.protocol = port.protocol;
    }
    return portMapping;
  });
};

export const selectSubnetsById = (scope: Construct, subnetIds: string[]) => {
  return {
    subnets: subnetIds.map((subnetId, index) =>
      Subnet.fromSubnetId(scope, `Subnet${index}`, subnetId)
    ),
  };
};
