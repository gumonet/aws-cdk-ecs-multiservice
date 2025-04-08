#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EcsMiltiTask } from "../lib/infra-stack";

const app = new cdk.App();
new EcsMiltiTask(app, "EcsMiltiTaskDev", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // Change to your desired region
  },
  // synthesizer: new cdk.DefaultStackSynthesizer({
  //   qualifier: "ecs-multi-tasks",
  // }),
  vpcId: "vpc-00b31d1ea6e9c5901",
  environment: "dev",
});
