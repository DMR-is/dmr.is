#!/bin/bash

set -euo pipefail

export INSTANCE_ID=$(aws ec2 describe-instances --profile dmr-dev --filters "Name=tag:Name,Values=dev-bastion" "Name=instance-state-name,Values=running" | jq -r '.Reservations[].Instances[].InstanceId')
aws ssm start-session --profile dmr-dev --target $INSTANCE_ID --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["8000"],"localPortNumber":["8000"]}'
