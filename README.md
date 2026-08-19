# dmr.is

Monorepo DMR

## Dependencies

TODO

## Start by running submodules checkout and install dependencies

Node is pinned in `.nvmrc` — run `nvm use` (or the equivalent for your version manager) first.

```bash
nvm use
./.gitscripts/checkout-submodules.sh
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
yarn
```

## Local environment setup

Environment variables are **declared** in `.env.schema` files — names, types and which values
are sensitive, never the values themselves. There is one at the repo root holding everything
shared, and one per app that imports only what that app actually reads:

```text
.env.schema                          shared across apps
apps/<app>/.env.schema               app-specific + @import(../../, pick=[...])
config/1password/.env.schema         local-only: where values come from
```

Values are **resolved** by [varlock](https://varlock.dev) from 1Password and exported into your
shell by `direnv`. Deployed services never use 1Password — ECS task definitions fill the same
variables — so local and deployed environments differ only in who populates `process.env`.

One-time setup:

```bash
brew install direnv 1password-cli
```

1. Enable the 1Password CLI integration: **Settings → Developer → Integrate with 1Password CLI**.
   Desktop-app auth needs the **beta** `op` CLI (v2.33.0+) for `op environment`; the stable
   Homebrew build does not include it.
2. Put the 1Password environment id in `.env.local` at the repo root (gitignored). It must resolve
   before authentication, so it cannot itself come from 1Password:

   ```bash
   echo 'OP_DMR_ENVIRONMENT=<environment-id>' >> .env.local
   ```

3. `direnv allow`

Check your setup with:

```bash
yarn varlock load --path config/1password --agent   # sensitive values redacted
yarn varlock load --path apps/legal-gazette-api     # validate one app
```

If varlock is missing or 1Password is unavailable, `.envrc` prints the error and falls back to
sourcing `.env.secret`, so an existing local setup keeps working.

**When you add a `process.env.X` read, declare `X`** — in `apps/<app>/.env.schema` if only that app
uses it, or in the root schema (and the app's `pick` list) if more than one does.

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

## Test swagger documentation codegeneration

This is particularly useful when making changes to apis, you can test the codegeneration before deploying the changes.

- You can test codegeneration by running `yarn openapi-generator:test`.
- It will run the client configuration placed under `tmp/swagger/client-config.json`
- If the file does not exist in your repository simply create it with the swagger-json you need to test.

## Pull requests

We use conventional commits for branch names.

Examples:

- `feat/add-user-authentication` - New feature
- `fix/resolve-login-timeout` - Bug fix
- `chore/update-dependencies` - Maintenance tasks

Title should include {type}({scope}): What was done
See [.github/workflows/pr.yml](.github/workflows/pr.yml) for allowed types and scopes.

Examples:

- fix(ojoi): Fixing something for official journal
- fix(regulations): Fixing something for regulations
- fix(lg): Fixing something for legal-gazette
- fix(shared): Fixing something that affects more than one project.

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

## Connection to AWS DEV Services

### Pre-requisites

- AWS CLI installed
- AWS credentials
- AWS credentials configured in a terminal session (e.g. login to [AWS console](https://dmr-is.awsapps.com/start/#) and copy the programmatic access key and secret key credentials and export them in the terminal session)

### Connection to DEV Database

#### Expose Database host on localhost

Database should be exposed on port 5432 on the bastion, but you can expose it to any port on your localhost.

```shell
# Example using port 5432
export INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=dev-bastion" "Name=instance-state-name,Values=running" | jq -r '.Reservations[].Instances[].InstanceId')
aws ssm start-session --target $INSTANCE_ID --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["5432"],"localPortNumber":["5432"]}'
```

or

```shell
sh ./scripts/run-pg-proxy.sh
```

## To generate a database with demo data

```Shell
nx run official-journal-api:dev-init
```

#### Connect to database

After exposing the database you can connect to it using any database client you would like.

**Connection details:**

- Official Journal DEV Database:
  - _DB_Name:_ `official_journal`
  - _DB_User:_ `official_journal`
  - _DB_Password:_ Can be found in AWS Secrets manager [here](https://eu-west-1.console.aws.amazon.com/secretsmanager/secret?name=utgafa_user_password20240130130225816700000001&region=eu-west-1&tab=overview).

### Connection to DEV XRoad Services locally

#### Expose XRoad host on localhost

XRoad should be exposed on port 8000 on the bastion, but you can expose it to any port on your localhost.

```shell
# Example using port 8000
export INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=dev-bastion" "Name=instance-state-name,Values=running" | jq -r '.Reservations[].Instances[].InstanceId')
aws ssm start-session --target $INSTANCE_ID --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["8000"],"localPortNumber":["8000"]}'
```

or

```shell
sh ./scripts/run-xroad-proxy.sh
```

#### Set environment variables for island-is XRoad in application

```shell
export XROAD_ISLAND_IS_PATH="http://localhost:8000/r1/IS-DEV/GOV/10000/island-is/"
export XROAD_DMR_CLIENT="IS-DEV/GOV/10014/DMR-Client"
```

## Create a new API

```shell
yarn nx generate @nx/nest:application --name=application-name --e2eTestRunner=none --projectNameAndRootFormat=derived --strict=true --no-interactive
```
