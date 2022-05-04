#!/bin/bash
# supress AWS CLI output
export AWS_PAGER=""

# Clean up all resources created in the tutorial
cdk destroy --all --force

# delete parameters and secret
aws secretsmanager delete-secret --secret-id thefullstacknerb-rds-credentials
aws ssm delete-parameter --name "/thefullstacknerb/google/username"
aws ssm delete-parameter --name "/thefullstacknerb/google/password"