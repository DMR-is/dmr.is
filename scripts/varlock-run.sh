#!/usr/bin/env bash
#
# Run a command with one app's environment, resolved from that app's own
# 1Password environment.
#
#   scripts/varlock-run.sh <app> <command> [args...]
#
# WHY THIS EXISTS INSTEAD OF A BARE `varlock run`
#
# Environment loading is mid-migration. Apps that have not moved yet still read
# .env.secret out of the shell (see .envrc), and process.env sits at the TOP of
# varlock's precedence chain -- above anything a schema resolves. So a variable
# left in the shell for an unmigrated app SILENTLY overrides the value a
# migrated app resolves for itself.
#
# That is not hypothetical. official-journal-web has not migrated and needs
# ISLAND_IS_DMR_WEB_CLIENT_ID in the shell; legal-gazette-web now reads the same
# name and would have authenticated against the Official Journal IDS client,
# booting cleanly the whole way.
#
# So before resolving, unset every key the app's own schema declares. The rule
# is simply that a declared key is the app's to decide, never the shell's.
# Undeclared shell vars (PATH, HOME, AWS session credentials, anything a tool
# needs) pass through untouched.
#
# This whole file becomes a no-op once .env.secret is gone, and can be deleted
# with the last app migrated.
#
set -euo pipefail

app="${1:-}"
shift || true

if [ -z "$app" ] || [ $# -eq 0 ]; then
  echo "usage: scripts/varlock-run.sh <app> <command> [args...]" >&2
  exit 2
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
here="$PWD"

schema_dir="$root/apps/$app"
config_dir="$root/config/1password/$app"

if [ ! -f "$schema_dir/.env.schema" ]; then
  echo "varlock-run: no schema at apps/$app/.env.schema" >&2
  exit 2
fi
if [ ! -f "$config_dir/.env.schema" ]; then
  echo "varlock-run: $app has not been migrated -- no config/1password/$app/" >&2
  exit 2
fi

# A globally installed varlock is preferred over the one under node_modules,
# because the Keychain ACL that holds OP_TOKEN is granted per binary path. See
# scripts/varlock.sh for why, and for the VARLOCK_BIN override.
if ! varlock="$("$root/scripts/varlock.sh" --resolve)"; then
  exit 2
fi

# Names are read straight out of the committed schema files. Resolving them
# through varlock instead would touch the encrypted value cache and prompt for
# a biometric unlock on every app launch, to learn nothing but a list of names.
#
# Assigned rather than piped into the loop so a failure aborts instead of
# degrading to an empty scrub list. Silently scrubbing nothing is precisely the
# wrong-value bug this script exists to prevent, and it would look like success.
if ! keys="$(node "$root/scripts/varlock-declared-keys.mjs" "$app")"; then
  echo "varlock-run: could not read declared keys from apps/$app/.env.schema" >&2
  exit 2
fi

# NEVER-SCRUB LIST
#
# A declared key is normally the app's to decide, never the shell's. These are
# the exception: they are ambient SESSION IDENTITY, not app configuration. In a
# container they come from the ECS task role; on a laptop they come from the
# developer's AWS session. No secret store holds them in either world -- the
# infra repo sets AWS_REGION on none of the services.
#
# Scrubbing them does not fail loudly, which is why this list exists. See
# libs/shared/modules/src/lib/aws/aws.service.ts: a missing AWS_CREDENTIALS_SOURCE
# silently switches the S3 and SES clients from fromIni(profile) to the SDK
# default chain, and a missing AWS_REGION silently falls back to a hardcoded
# 'eu-west-1'. Both boot cleanly and talk to the wrong place.
#
# They stay declared in the schemas so varlock still type-checks them. They are
# exempt from the scrub only, and must never be marked @required.
#
# Note for whoever migrates regulations-api: that app declares all three rungs
# of its own region fallback ladder -- AWS_REGION picked from the root schema,
# plus AWS_DEFAULT_REGION and AWS_REGION_NAME of its own -- so without this list
# the scrub would knock out the entire ladder at once.
never_scrub=" AWS_REGION AWS_DEFAULT_REGION AWS_REGION_NAME AWS_CREDENTIALS_SOURCE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE "

scrub=""
while IFS= read -r key; do
  [ -z "$key" ] && continue
  case "$never_scrub" in
    *" $key "*) continue ;;
  esac
  scrub="$scrub -u $key"
done <<< "$keys"

# varlock's value cache is ENCRYPTED, so every read costs a decrypt, and the
# decrypt asks for biometric unless the encryption daemon happens to be holding
# a session. cacheTtl therefore does the opposite of what it looks like it does:
# set to 1h it made EVERY app launch prompt. No config sets it -- see the note
# in config/1password/README.md -- and each app resolves fresh instead.
#
# The cache is still written, and it caches failed and empty results too, so an
# edit made in 1Password can still look like "my change did nothing":
#
#   VARLOCK_FRESH=1 yarn nx serve <app>
#
fresh=""
if [ -n "${VARLOCK_FRESH:-}" ]; then
  fresh="--clear-cache"
  echo "varlock-run: clearing cache before resolving $app" >&2
fi

cd "$here"
# shellcheck disable=SC2086  # deliberate word-splitting; keys match [A-Z0-9_]
exec env $scrub "$varlock" run --path "$config_dir" $fresh -- "$@"
