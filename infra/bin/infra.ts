#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ZappDemoHttpServer } from "../lib/infra-stack";

const app = new cdk.App();
const devStack = new ZappDemoHttpServer(app, "ZappDemoHttpServerDev", {
  env: {
    account: "438605559430",
    region: "us-east-1",
  },
  stage: "dev",
  vpcId: "vpc-00b31d1ea6e9c5901",
  repositoryName: "zapp-cores-unir",
  secretId: "dev/cores-unir-TEni7z",
  mainZappNLB: "ZappMainNLB-dev/99934751df82ff15",
  apiGateway: {
    restApiId: "08vdjgtdvc",
    rootResourceId: "kd2xp9",
  },
  vpcLinkId: "sit6ah",
  subnetIds: ["subnet-0a6141ae2070b8208", "subnet-0b2d339560f176811"],
});
devStack.tags.setTag("project", "cores-unir-operations");
devStack.tags.setTag("stage", "dev");
