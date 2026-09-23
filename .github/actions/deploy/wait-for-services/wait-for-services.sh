#!/usr/bin/env bash
# Waits until every ECS service in SERVICES has finished rolling out VERSION_TAG.
#
# `aws ecs wait services-stable` is not enough:
# - The circuit breaker rolls a failed rollout back to the previous task
#   definition, and the service then reports stable on the old version.
# - It passes once runningCount matches desiredCount, which counts tasks the
#   load balancer has not health-checked yet. The breaker stays armed until the
#   deployment's rolloutState is COMPLETED, so a deploy can pass and then roll back.
# - It takes at most 10 services and gives up after 10 minutes.
#
# So this polls describe-services itself. A service passes once its primary
# deployment runs an image tagged VERSION_TAG, is COMPLETED (or reports no
# rolloutState at all, see below) and is the only deployment, with all its tasks
# running. A primary deployment on another tag means the rollout was rolled back
# or never applied. A rollback to another revision with the same tag, such as a
# failed infra-only change re-applied under a live tag, still passes: telling
# those apart needs the task definition ARN terraform applied.
#
# Env: CLUSTER, SERVICES (space-separated), VERSION_TAG, TIMEOUT_MINUTES
# (default 20), POLL_SECONDS (default 15). Expects AWS credentials for the
# cluster's account to be configured already. test/run.sh exercises it against a
# fake aws.

set -uo pipefail

: "${CLUSTER:?}" "${SERVICES:?}" "${VERSION_TAG:?}"
timeout_minutes=${TIMEOUT_MINUTES:-20}
poll_seconds=${POLL_SECONDS:-15}
batch_size=10 # the most describe-services accepts in one call
max_failed_polls=5

read -r -d '' -a pending <<< "$SERVICES" || true # -d '' so newlines split too
if [ "${#pending[@]}" -eq 0 ]; then
  echo "::error::No services to wait for in $CLUSTER"
  exit 1
fi

declare -A images_of # task definition ARN -> its images, comma-separated
declare -A runs_tag  # task definition ARN -> true when an image is tagged VERSION_TAG
declare -A last_seen # service -> its last observed rollout state
failed=0
poll=0
failed_polls=0
last_api_error=
deadline=$(($(date +%s) + timeout_minutes * 60))
err_file=$(mktemp)
trap 'rm -f "$err_file"' EXIT

error() {
  echo "::error::$*"
  failed=1
}

# Throttling and brief outages are retried. Counted per poll rather than per
# call, so the limit does not depend on how many services a poll checks; a run
# of failed polls is what expired or missing credentials look like.
api_error() {
  poll_failed=true
  last_api_error="$1: $(tr '\n' ' ' < "$err_file")"
  echo "::warning::$last_api_error"
}

# Checks one service in $services_json, adding it to `waiting` if its rollout
# has not settled yet.
check_service() {
  local service=$1 state task_definition rollout deployments running desired reason definition

  state=$(jq -r --arg service "$service" '
    first(.services[] | select(.serviceName == $service and .status == "ACTIVE")) as $svc
    | first($svc.deployments[] | select(.status == "PRIMARY")) as $primary
    | [$primary.taskDefinition, ($primary.rolloutState // "UNKNOWN"), ($svc.deployments | length),
       ($primary.runningCount // 0), ($svc.desiredCount // 0), ($primary.rolloutStateReason // "")]
    | @tsv' <<< "$services_json")

  if [ -z "$state" ]; then
    error "$service has no active primary deployment in $CLUSTER"
    return
  fi
  IFS=$'\t' read -r task_definition rollout deployments running desired reason <<< "$state"

  if [ -z "${runs_tag[$task_definition]+set}" ]; then
    if ! definition=$(aws ecs describe-task-definition --task-definition "$task_definition" --output json 2> "$err_file"); then
      api_error describe-task-definition
      last_seen[$service]="task definition not read yet"
      waiting+=("$service")
      return
    fi
    images_of[$task_definition]=$(jq -r '[.taskDefinition.containerDefinitions[].image] | join(", ")' <<< "$definition")
    # Sidecars (datadog, fluent-bit) carry their own tags, so one match is enough.
    runs_tag[$task_definition]=$(jq --arg tag "$VERSION_TAG" \
      'any(.taskDefinition.containerDefinitions[].image; endswith(":" + $tag))' <<< "$definition")
  fi

  if [ "${runs_tag[$task_definition]}" != true ]; then
    # describe-services is eventually consistent after the update, so the first
    # read may still show the previous revision. Only a repeat is conclusive.
    if [ "$poll" -gt 1 ]; then
      error "$service runs ${images_of[$task_definition]}, not $VERSION_TAG: the rollout was rolled back or never applied"
      return
    fi
    last_seen[$service]="still on ${images_of[$task_definition]}"
    waiting+=("$service")
    return
  fi

  case "$rollout" in
    FAILED)
      error "$service failed to roll out $VERSION_TAG: ${reason:-no reason given}"
      return
      ;;
    # UNKNOWN: rolloutState is only reported with the ECS deployment controller,
    # which every service here uses. Without it, fall back to steady state.
    COMPLETED | UNKNOWN)
      if [ "$deployments" = 1 ] && [ "$running" = "$desired" ]; then
        if [ "$rollout" = UNKNOWN ]; then
          echo "::warning::$service reports no rolloutState, so it passed on steady state alone"
        fi
        echo "✅ $service runs $VERSION_TAG"
        return
      fi
      ;;
  esac

  last_seen[$service]="$rollout, $running/$desired running, $deployments deployments"
  waiting+=("$service")
}

while :; do
  poll=$((poll + 1))
  poll_failed=false
  waiting=()

  for ((i = 0; i < ${#pending[@]}; i += batch_size)); do
    batch=("${pending[@]:i:batch_size}")
    if ! services_json=$(aws ecs describe-services --cluster "$CLUSTER" --services "${batch[@]}" --output json 2> "$err_file"); then
      api_error describe-services
      waiting+=("${batch[@]}")
      continue
    fi
    for service in "${batch[@]}"; do
      check_service "$service"
    done
  done

  pending=("${waiting[@]}")
  [ "${#pending[@]}" -eq 0 ] && break

  if [ "$poll_failed" = true ]; then
    failed_polls=$((failed_polls + 1))
  else
    failed_polls=0
  fi

  if [ "$failed_polls" -ge "$max_failed_polls" ]; then
    for service in "${pending[@]}"; do
      error "$service could not be checked, AWS calls failed on the last $max_failed_polls polls. $last_api_error"
    done
    break
  fi

  if [ "$(date +%s)" -ge "$deadline" ]; then
    for service in "${pending[@]}"; do
      error "$service is still rolling out $VERSION_TAG after $timeout_minutes minutes (${last_seen[$service]:-not checked yet})"
    done
    break
  fi

  status=
  for service in "${pending[@]}"; do
    status+=" $service (${last_seen[$service]:-not checked yet});"
  done
  echo "⏳ Waiting on${status%;}"
  sleep "$poll_seconds"
done

exit "$failed"
