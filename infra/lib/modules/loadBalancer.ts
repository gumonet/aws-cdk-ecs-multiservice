import {
  INetworkLoadBalancer,
  NetworkListener,
  NetworkLoadBalancer,
  Protocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { INFRA_STACK_PREFIX } from "./utils";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { FargateService, IEcsLoadBalancerTarget } from "aws-cdk-lib/aws-ecs";
export class stakLoadBalancer {
  vpc: IVpc;
  scope: Construct;
  private loadBalancerInstance: INetworkLoadBalancer;
  constructor(
    scope: Construct,
    vpc: IVpc,
    region: string,
    account: string,
    loadbalancerName: string
  ) {
    this.scope = scope;
    this.vpc = vpc;
    this.loadBalancerInstance = this.getLoadBalancer(
      region,
      account,
      loadbalancerName
    );
  }

  private getLoadBalancer(
    region: string,
    account: string,
    loadbalancerName: string
  ) {
    return NetworkLoadBalancer.fromLookup(
      this.scope,
      `${INFRA_STACK_PREFIX}MainLoadBalancer`,
      {
        loadBalancerArn: `arn:aws:elasticloadbalancing:${region}:${account}:loadbalancer/net/${loadbalancerName}`,
      }
    );
  }

  public getLoadBalancerObject() {
    return this.loadBalancerInstance;
  }

  public addListenerPort(id: string, port: number, protocol: Protocol) {
    return this.loadBalancerInstance.addListener(id, {
      port: port,
      protocol: protocol,
    });
  }
  public addTargetGroup(
    listener: NetworkListener,
    id: string,
    port: number,
    protocol: Protocol,
    targetGroupName: string,
    serviceLBTarget: IEcsLoadBalancerTarget
  ) {
    return listener.addTargets(id, {
      port: port,
      protocol: protocol,
      targetGroupName: targetGroupName,
      targets: [serviceLBTarget],
    });
  }
}
