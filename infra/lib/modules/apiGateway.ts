import {
  IRestApi,
  IResource,
  RestApi,
  RestApiAttributes,
  VpcLink,
  Integration,
  IntegrationType,
  ConnectionType,
  Resource,
  Deployment,
  Stage,
  IVpcLink,
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { INFRA_STACK_PREFIX } from "./utils";
import { INetworkLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
const API_ROOT_PROJECT_RESOURCE = "operations";
export class ApiGatewayConfiguration {
  scope: Construct;
  apiGateway: IRestApi;
  stackStage: string;

  constructor(
    scope: Construct,
    apiGtwProps: RestApiAttributes,
    vpcLinkId: string,
    loadBalancerTarget: INetworkLoadBalancer,
    stackStage: string
  ) {
    this.scope = scope;
    this.apiGateway = this.getApiGateway(apiGtwProps);
    this.stackStage = stackStage;

    const vpcLink = this.getVpcLink(vpcLinkId);
    const apiGtwProjectRootResource = this.addRootProjectResource(); // "/api/v1/operations"
    const integration = this.addVPLinkProxyIntegration(
      vpcLink,
      loadBalancerTarget.loadBalancerDnsName
    );
    this.addProxy(apiGtwProjectRootResource, integration);
  }
  private getApiGateway(apiGtwProps: RestApiAttributes) {
    return RestApi.fromRestApiAttributes(
      this.scope,
      `${INFRA_STACK_PREFIX}Api`,
      apiGtwProps
    );
  }
  private addRootProjectResource() {
    //let apiRootPath = this.getApiRoot();
    return this.apiGateway.root.addResource(API_ROOT_PROJECT_RESOURCE);
  }

  private addVPLinkProxyIntegration(
    vpcLink: IVpcLink,
    loaBalancerDnsName: string
  ) {
    //Create Integration
    return new Integration({
      type: IntegrationType.HTTP_PROXY,
      integrationHttpMethod: "ANY",
      options: {
        connectionType: ConnectionType.VPC_LINK,
        vpcLink: vpcLink,
        requestParameters: {
          "integration.request.path.proxy": "method.request.path.proxy",
        },
      },
      uri: `http://${loaBalancerDnsName}:7857/api/v1/${API_ROOT_PROJECT_RESOURCE}/{proxy}`,
    });
  }

  private addProxy(rootResource: Resource, integration: Integration) {
    rootResource.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
      defaultMethodOptions: {
        requestParameters: { "method.request.path.proxy": true },
      },
    });
  }

  private getVpcLink(vpcLinkId: string) {
    return VpcLink.fromVpcLinkId(
      this.scope,
      `${INFRA_STACK_PREFIX}VPCLink`,
      vpcLinkId
    );

    /*return new VpcLink(this.scope, `${INFRA_STACK_PREFIX}VPCLink`, {
      targets: [loadBalancers],
      vpcLinkName: `${INFRA_STACK_PREFIX}-vpc-link`,
    });*/
  }
}
