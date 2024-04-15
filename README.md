# dmr.is

Monorepo DMR

## Dependencies

TODO

## Start by running submodules checkout

```bash
./.gitscripts/checkout-submodules.sh
```

## Generate client and schemas for web app

```bash
nx run official-journal-web:update-openapi-schema
nx run official-journal-web:codegen
```

## Starting the web app

```bash
nx serve official-journal-admin-api
nx serve official-journal-web
```

## Git submodules

Submodules are configured with [.envrc.git](./.envrc.git) by adding [post-checkout](https://git-scm.com/docs/githooks#_post_checkout) and [post-merge](https://git-scm.com/docs/githooks#_post_merge) hooks to the repository. This means that after cloning the repository, the submodules are automatically initialized and updated.

The `.envrc` script will create/override the following files:

```bash
.git/hooks/post-checkout
.git/hooks/post-merge
```

To pin a submodule to a specific commit or the paths that should be checked out, update the `sha` property in the [submodules/config.json](./submodules/config.json) file.

To play around with the automation script you can modify the the config file and run the script manually:

```bash

{
  "submodules": [
    {
      "name": "island.is",
      "sha": "HEAD~5", # some commit sha
      "sparseCheckoutPaths": [
        "libs/shared"
      ]
    }
  ]
}

./.gitscripts/checkout-submodules.sh
```

## Connection to DEV XRoad Services locally

### Pre-requisites

- AWS CLI installed
- AWS credentials
- AWS credentials configured in a terminal session (e.g. login to AWS console and copy the programmatic access key and secret key credentials and export them in the terminal session)

### Expose XRoad host on localhost

XRoad should be exposed on port 8000 on the bastion, but you can expose it to any port on your localhost.

```shell
# Example using port 8000
export INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=dev-bastion" "Name=instance-state-name,Values=running" | jq -r '.Reservations[].Instances[].InstanceId')
aws ssm start-session --target $INSTANCE_ID --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["8000"],"localPortNumber":["8000"]}'
```

### Set environment variables for island-is XRoad in application

```shell
export XROAD_ISLAND_IS_PATH="http://localhost:8000/r1/IS-DEV/GOV/10000/island-is/"
export XROAD_DMR_CLIENT="IS-DEV/GOV/10014/DMR-Client"
```
