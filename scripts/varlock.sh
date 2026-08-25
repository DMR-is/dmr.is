#!/usr/bin/env bash
#
# Resolve which varlock binary to run, for every caller in the repo.
#
#   scripts/varlock.sh <varlock-args...>   run varlock
#   scripts/varlock.sh --resolve           print the path that would be run
#
# WHY A GLOBAL INSTALL IS PREFERRED OVER node_modules/.bin
#
# Resolving a value means decrypting the device-local 1Password token, which is
# done by varlock's native helper (VarlockEnclave). The helper runs as a daemon
# that holds an authenticated session, so you authenticate ONCE per session
# rather than once per command.
#
# Each varlock install ships its own copy of that helper. The daemon belongs to
# whichever copy started it, so alternating between the Homebrew varlock and the
# one under node_modules tears the session down and forces a fresh
# authentication. Pinning every caller to one binary keeps one daemon, and so
# one prompt per session instead of one per switch.
#
# The copy under node_modules is the unstable side of that pair: `yarn install`
# rewrites it, which also kills any daemon running from it. Homebrew's path is
# stable across everything except its own upgrades.
#
# The fallback still matters: CI, the Docker build stages and a fresh clone have
# no global install, and land on the version package.json pins. None of them
# decrypt anything, so nothing is lost there.
#
# CAVEAT, and the reason for VARLOCK_BIN: the global binary is upgraded by
# Homebrew on its own schedule and will drift from the pinned version. That is
# accepted for local runs -- schema syntax and `run`/`flatten` are stable across
# minors -- but if a global varlock ever misbehaves, pin it back for one command
# without touching this file:
#
#   VARLOCK_BIN=./node_modules/.bin/varlock scripts/varlock-run.sh <app> <cmd>
#
# NOT FOR THE flatten-env TARGETS, and that is deliberate. They call
# node_modules/.bin/varlock directly and should keep doing so. `varlock flatten`
# never resolves a value -- it is a purely structural @import rewrite -- so it
# never decrypts anything and has nothing to gain here. It has something to
# lose: the flattened schema is read at container boot by the varlock version
# pinned in each Dockerfile, so the binary that writes it must be the pinned one
# too. Routing those targets through this script would silently flatten with
# whatever Homebrew last installed.
#
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

is_runnable() {
  [ -f "$1" ] && [ -x "$1" ]
}

resolve() {
  # 1. Explicit override wins, and a bad one is a hard error rather than a
  #    silent downgrade to a different binary than the caller asked for.
  if [ -n "${VARLOCK_BIN:-}" ]; then
    if is_runnable "$VARLOCK_BIN"; then
      printf '%s\n' "$VARLOCK_BIN"
      return 0
    fi
    echo "varlock: VARLOCK_BIN=$VARLOCK_BIN is not an executable file" >&2
    return 2
  fi

  # 2. A globally installed varlock. PATH is walked by hand instead of using
  #    `command -v` because yarn and nx prepend node_modules/.bin to PATH, so
  #    `command -v varlock` under `yarn nx serve` returns the workspace copy --
  #    the exact binary this ordering exists to avoid. Any node_modules hit is
  #    skipped, not just this repo's: another project's install is not global
  #    either, and ships its own helper all the same.
  local dir candidate
  local IFS=:
  for dir in $PATH; do
    [ -z "$dir" ] && continue
    case "$dir" in
      */node_modules|*/node_modules/*) continue ;;
    esac
    candidate="$dir/varlock"
    if is_runnable "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  # 3. The workspace copy, at the version package.json pins.
  candidate="$root/node_modules/.bin/varlock"
  if is_runnable "$candidate"; then
    printf '%s\n' "$candidate"
    return 0
  fi

  echo "varlock: not found -- install it globally (brew install dmno-dev/tap/varlock)" >&2
  echo "         or run yarn install to use the workspace copy" >&2
  return 2
}

if [ "${1:-}" = "--resolve" ]; then
  resolve
  exit $?
fi

varlock="$(resolve)"
exec "$varlock" "$@"
