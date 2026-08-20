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

varlock="$root/node_modules/.bin/varlock"
if [ ! -x "$varlock" ]; then
  echo "varlock-run: $varlock not found -- run yarn install" >&2
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

scrub=""
while IFS= read -r key; do
  [ -n "$key" ] && scrub="$scrub -u $key"
done <<< "$keys"

# 1Password lookups are cached for an hour (see cacheTtl in the app's config),
# which keeps Touch ID out of every app launch but means an edit made in
# 1Password does NOT show up here until the cache expires. That reads exactly
# like "my change did nothing" -- it has already cost two debugging sessions.
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
