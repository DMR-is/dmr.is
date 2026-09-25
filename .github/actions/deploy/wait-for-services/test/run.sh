#!/usr/bin/env bash
# Runs wait-for-services.sh against the fake aws beside this file. Needs bash 4+
# and jq. Usage: bash .github/actions/deploy/wait-for-services/test/run.sh

set -uo pipefail
here=$(cd "$(dirname "$0")" && pwd)
script=$here/../wait-for-services.sh
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
chmod +x "$here/aws"
failures=0

# expect <name> <exit> <output regex> <tag> <timeout minutes> <spec line>...
# Env for the fake (TD_FAILURES) is passed through from the caller.
expect() {
  local name=$1 want_exit=$2 want_output=$3 tag=$4 timeout=$5 services output got_exit
  shift 5
  rm -rf "$work/state" && mkdir "$work/state"
  printf '%s\n' "$@" > "$work/spec"
  services=$(printf '%s\n' "$@" | cut -d' ' -f1 | tr '\n' ' ')
  output=$(PATH="$here:$PATH" STATE=$work/state SPEC=$work/spec CLUSTER=test-cluster SERVICES=$services \
    VERSION_TAG=$tag TIMEOUT_MINUTES=$timeout POLL_SECONDS=0 bash "$script" 2>&1)
  got_exit=$?
  if [ "$got_exit" = "$want_exit" ] && grep -qE -- "$want_output" <<< "$output"; then
    echo "ok   $name"
  else
    echo "FAIL $name: exit $got_exit (want $want_exit), output:"
    echo "     ${output//$'\n'/$'\n'     }"
    failures=$((failures + 1))
  fi
}

# How many describe-services calls the last case made.
polls() { grep -c describe-services "$work/state/calls"; }

A=directorate-of-equality-api
W=directorate-of-equality-web
ok="$W v1.93.0:COMPLETED:1/1:1"

expect "IN_PROGRESS then COMPLETED passes" 0 "✅ $A runs v1.93.0" v1.93.0 1 \
  "$A v1.93.0:IN_PROGRESS:1/2:2 v1.93.0:IN_PROGRESS:2/2:2 v1.93.0:COMPLETED:2/2:1" "$ok"
expect "all tasks running but IN_PROGRESS keeps waiting, then the rollback fails" 1 "$A runs .*:v1.92.0.*rolled back" v1.93.0 1 \
  "$A v1.93.0:IN_PROGRESS:1/1:1 v1.93.0:IN_PROGRESS:1/1:1 v1.92.0:IN_PROGRESS:0/1:2 v1.92.0:COMPLETED:1/1:1" "$ok"
expect "COMPLETED while the old deployment drains keeps waiting" 0 "✅ $A" v1.93.0 1 \
  "$A v1.93.0:COMPLETED:1/1:2 v1.93.0:COMPLETED:1/1:1" "$ok"
expect "IN_PROGRESS then FAILED reports the reason" 1 "$A failed to roll out v1.93.0: ECS deployment circuit breaker" v1.93.0 1 \
  "$A v1.93.0:IN_PROGRESS:0/1:2 v1.93.0:FAILED:0/1:2" "$ok"
expect "a stale first read of the old revision is not a rollback" 0 "✅ $A runs v1.93.0" v1.93.0 1 \
  "$A v1.92.0:COMPLETED:1/1:1 v1.93.0:IN_PROGRESS:1/1:2 v1.93.0:COMPLETED:1/1:1" "$ok"

many=()
for i in $(seq 1 11); do many+=("svc-$i v1.93.0:IN_PROGRESS:0/1:2 v1.93.0:COMPLETED:1/1:1"); done
expect "11 services are checked in batches of 10" 0 "✅ svc-11 runs" v1.93.0 1 "${many[@]}"

expect "a rollout still IN_PROGRESS at the deadline fails" 1 "$A is still rolling out v1.93.0 after 0 minutes \(IN_PROGRESS" v1.93.0 0 \
  "$A v1.93.0:IN_PROGRESS:1/2:2" "$ok"
expect "a missing service fails" 1 "$W has no active primary deployment" v1.93.0 1 "$A v1.93.0:COMPLETED:1/1:1" "$W MISSING"
expect "tags match exactly, not by prefix" 1 "$W runs .*:v1.19.0, .*not v1.9.0" v1.9.0 1 \
  "$A v1.93.0:COMPLETED:1/1:1" "$W v1.19.0:COMPLETED:1/1:1"
expect "whitespace-only SERVICES fails" 1 "No services to wait for" v1.93.0 1 " "
expect "no rolloutState passes on steady state, with a warning" 0 "::warning::$A reports no rolloutState" v1.93.0 1 \
  "$A v1.93.0:-:1/2:2 v1.93.0:-:2/2:1" "$W v1.93.0:-:1/1:1"

expect "describe-services failing twice is retried" 0 "✅ $A runs v1.93.0" v1.93.0 1 "$A ERR ERR v1.93.0:COMPLETED:1/1:1" "$ok"
expect "describe-services failing on every poll gives up after 5" 1 "$A could not be checked.*ExpiredTokenException" v1.93.0 1 "$A ERR" "$ok"
[ "$(polls)" = 5 ] || { echo "FAIL expected 5 polls, got $(polls)" && failures=$((failures + 1)); }

# Task definition failures count once per poll, however many services the poll checks.
TD_FAILURES=1000 expect "describe-task-definition failing for 2 services gives up after 5 polls" 1 \
  "$A could not be checked.*AccessDenied" v1.93.0 1 "$A v1.93.0:COMPLETED:1/1:1" "$ok"
[ "$(polls)" = 5 ] || { echo "FAIL expected 5 polls, got $(polls)" && failures=$((failures + 1)); }
nine=()
for i in $(seq 1 9); do nine+=("svc-$i v1.93.0:COMPLETED:1/1:1"); done
TD_FAILURES=9 expect "describe-task-definition failing 9 times in one poll is retried" 0 "✅ svc-9 runs" v1.93.0 1 "${nine[@]}"

[ "$failures" -eq 0 ] && echo "all passed" || echo "$failures failed"
exit "$((failures > 0))"
