#!/bin/bash

# supress AWS CLI output
export AWS_PAGER=""

# create sample Google credential
aws ssm put-parameter --name "/thefullstacknerb/google/username" \
  --value "my-secret-google-username" \
  --type "SecureString"
aws ssm put-parameter --name "/thefullstacknerb/google/password" \
  --value "my-secret-google-password" \
  --type "SecureString" \
  

# create sample RDS credentials secret
aws --no-paginate secretsmanager create-secret \
    --name thefullstacknerb-rds-secrets \
    --secret-string file://bin/scripts/rds-secrets.json

# deploy cdk application
cdk bootstrap
cdk deploy --all --require-approval=never