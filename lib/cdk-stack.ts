import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";
import { Pipeline } from "aws-cdk-lib/aws-codepipeline";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const source = CodePipelineSource.gitHub(
      "khuongdo/thefullstacknerb_secure-codebuild-using-parameter-store-secrets-manager",
      "main",
      {
        /**
         * The secret store Github token
         * Please see this tutorial if you haven't created it yet.
         * https://thefullstacknerb.com/how-to-create-your-first-cdk-application/#Generate_Github_token
         */
        authentication: SecretValue.secretsManager("github-secret"),
      }
    );

    // Secret which is created in deploy.sh
    // See bin/scripts/deploy.sh for more detail
    const rdsSecrets = Secret.fromSecretNameV2(
      this,
      "RdsSecrets",
      "thefullstacknerb-rds-secrets"
    );

    const cdkPipeline = new CodePipeline(this, "CdkPipeline", {
      selfMutation: true,
      synth: new ShellStep("Synth", {
        input: source,
        commands: [
          "npm ci",
          "npm run build",
          "npx cdk synth",
          /**
           * Print all environment variables of codebuild instance
           * Use to prove that environment variables are injected successfully
           * CAUTIONS: DON'T DO IT IN YOUR REAL WORLD APP ^^
           */
          "printenv",
        ],
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          environmentVariables: {
            /**
             * Secrets Manager env var pattern:
             * VAR_NAME :{
             *  type: "SECRETS_MANAGER",
             *  value: <secret-id>:<json-key>
             * }
             * @see: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec.env.secrets-manager
             */
            DB_HOST: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: this.resolveSecret(rdsSecrets, "host"),
            },
            DB_USERNAME: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: this.resolveSecret(rdsSecrets, "username"),
            },
            DB_PASSWORD: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: this.resolveSecret(rdsSecrets, "password"),
            },
            DB_DATABASE: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: this.resolveSecret(rdsSecrets, "dbname"),
            },
            DB_PORT: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: this.resolveSecret(rdsSecrets, "port"),
            },

            /**
             * SSM Parameter Store pattern
             * VAR_NAME: {
             *   type: "PARAMETER_STORE",
             *   value: <parameter-name>
             * }
             * @see: https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec.env.parameter-store
             */
            GOOGLE_USERNAME: {
              type: BuildEnvironmentVariableType.PARAMETER_STORE,
              value: "/thefullstacknerb/google/username",
            },
            GOOGLE_PASSWORD: {
              type: BuildEnvironmentVariableType.PARAMETER_STORE,
              value: "/thefullstacknerb/google/password",
            },

            // Plain text env var
            APP_NAME: {
              value: "The full stack nerb tutorial",
            },
          },
        },
      },
    });
  }

  private resolveSecret(secret: ISecret, jsonField?: string) {
    if (!jsonField) return secret.secretName;
    return `${secret.secretName}:${jsonField}`;
  }
}
