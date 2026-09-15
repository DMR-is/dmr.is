#!/bin/bash

set -euo pipefail

GIT_ROOT=$(git rev-parse --show-toplevel)
CONFIG_FILE="${GIT_ROOT}/submodules/config.json"

while read -r submodule; do
  NAME=$(echo "${submodule}" | jq -r '.name')
  SUBMODULE_PATH="${GIT_ROOT}/submodules/${NAME}"
  SHA=$(echo "${submodule}" | jq -r '.sha')

  # patch-submodules.sh generates a tsconfig.base.json stub over a file that IS
  # tracked upstream, which leaves the submodule permanently dirty. Every command
  # below that moves the working tree - `submodule update`, `checkout <sha>`,
  # `sparse-checkout set` - refuses to clobber it, so a bump would fail with
  # "local changes would be overwritten by checkout". Drop it up front; the stub
  # is regenerated at the end of this script.
  rm -f "${SUBMODULE_PATH}/tsconfig.base.json"

  # The submodule is vendored code pinned to an exact commit, so its working
  # tree should always BE that commit. Anything modified in it is either
  # generated or accidental - prettier has silently reformatted these files
  # before, invisible in `git status` because .gitmodules sets `ignore = dirty`.
  #
  # Reset it, but say what was discarded. Without this, a stale island-is
  # patch left applied blocks `checkout <sha>` with "local changes would be
  # overwritten" and wedges every future bump.
  if [ -e "${SUBMODULE_PATH}/.git" ]; then
    DIRTY=$(git -C "${SUBMODULE_PATH}" status --porcelain | wc -l | tr -d ' ')
    if [ "${DIRTY}" != "0" ]; then
      echo "ℹ️  ${NAME}: discarding ${DIRTY} local modification(s) in the submodule:" >&2
      git -C "${SUBMODULE_PATH}" status --porcelain | sed 's/^/     /' >&2
      git -C "${SUBMODULE_PATH}" checkout --quiet -- .
    fi
  fi

  # Quietly ensure submodule is initialized and updated.
  #
  # In CI this is always a fresh clone and only the pinned commit is ever read,
  # so skip the history. island.is is 448 MiB cloned in full against 46 MiB at
  # --depth 1, and that clone was 24-27s of the 31s the tsc job spent in
  # actions/checkout. Locally keep the full clone: the "commits since" listing at
  # the bottom of this loop needs history, and a developer's clone is reused.
  #
  # Note the flag that looks like it should help here and does not.
  # --filter=blob:none through `git submodule update` is *worse* than no filter
  # (87 MiB): git checks out the default branch, then the pinned SHA, and each
  # checkout demand-fetches every blob in the tree, because the sparse patterns
  # below are not set yet. A blobless clone only pays off if the sparse patterns
  # are in place before the first checkout, which `git submodule update` gives
  # no way to arrange.
  if [ -n "${CI:-}" ] && [ ! -e "${SUBMODULE_PATH}/.git" ]; then
    git submodule update --init --depth 1 --quiet "${SUBMODULE_PATH}"
  else
    git submodule update --init --quiet "${SUBMODULE_PATH}"
  fi

  # Fetch so the "commits since" listing below is current. In CI that listing is
  # never read and actions/checkout has already fetched, so only pay for it when
  # the pinned commit is genuinely missing. Best effort either way - a developer
  # working offline should still get a working checkout.
  if [ -z "${CI:-}" ] || ! git -C "${SUBMODULE_PATH}" cat-file -e "${SHA}^{commit}" 2>/dev/null; then
    git -C "${SUBMODULE_PATH}" fetch --quiet --prune ||
      echo "⚠️  ${NAME}: fetch failed, continuing with local objects" >&2
  fi

  # Checkout to the specified SHA quietly
  git -C "${SUBMODULE_PATH}" checkout --quiet "${SHA}"

  # --- Sparse checkout ---
  #
  # `core.sparseCheckoutPath` is NOT a git config variable (see `git help -c`);
  # git ignored it, so this used to be a no-op that accumulated one dead config
  # entry per checkout. Drop it from clones that still carry it.
  git -C "${SUBMODULE_PATH}" config --unset-all core.sparseCheckoutPath 2>/dev/null || true

  # Let the porcelain own this. Writing $GIT_DIR/info/sparse-checkout and
  # core.sparseCheckout by hand is not enough: once anything has run
  # `git sparse-checkout`, extensions.worktreeConfig is set and the
  # worktree-scoped core.sparseCheckout silently overrides the local one.
  # `set` also prunes the working tree, which `read-tree -mu HEAD` will not do
  # when the index already matches HEAD.
  #
  # --no-cone because cone mode cannot express the `!project.json` negation.
  # Patterns are gitignore-style and the LAST match wins, so negations go last.
  {
    echo "${submodule}" | jq -r '.sparseCheckoutPaths[]'
    echo "${submodule}" | jq -r '(.sparseCheckoutExcludes // [])[] | "!" + .'
  } | git -C "${SUBMODULE_PATH}" sparse-checkout set --no-cone --stdin

  # An empty submodule surfaces as a wall of missing-module errors much later,
  # so fail here instead.
  CANARY=$(echo "${submodule}" | jq -r '.canaryPath // empty')
  if [ -n "${CANARY}" ] && [ ! -f "${SUBMODULE_PATH}/${CANARY}" ]; then
    echo "❌ ${NAME}: expected '${CANARY}' after checkout but it is missing." >&2
    echo "   The sparse-checkout patterns in submodules/config.json are probably wrong." >&2
    exit 1
  fi

  # The gitlink and config.json must move in lockstep, otherwise Nx hashes a SHA
  # that does not match the code on disk (config.json is in nx.json sharedGlobals).
  # Read the index, not HEAD, so a staged-but-uncommitted bump does not warn.
  GITLINK=$(git -C "${GIT_ROOT}" rev-parse ":submodules/${NAME}" 2>/dev/null || echo '')
  if [ -n "${GITLINK}" ] && [ "${GITLINK#"${SHA}"}" = "${GITLINK}" ]; then
    echo "⚠️  ${NAME}: submodules/config.json pins ${SHA} but the gitlink is ${GITLINK}." >&2
  fi

  # Informational: what has landed upstream in the paths we actually consume.
  #
  # Skipped on a shallow clone. There origin/main is whatever tip the depth-1
  # fetch happened to land on with no history behind it, so the listing would be
  # silently wrong rather than merely empty - and `git log` can exit non-zero,
  # which `set -e` would turn into a failed checkout.
  SPARSE_PATHS=$(echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | xargs)
  IS_SHALLOW=$(git -C "${SUBMODULE_PATH}" rev-parse --is-shallow-repository 2>/dev/null || echo true)
  if [ -n "$SPARSE_PATHS" ] && [ "${IS_SHALLOW}" != "true" ] &&
    git -C "${SUBMODULE_PATH}" rev-parse --verify --quiet origin/main >/dev/null; then
    echo -e "🚀 Commits in ${NAME} from ${SHA} to origin/main affecting paths:\n"
    git -C "${SUBMODULE_PATH}" log --color=always --pretty=format:'%C(auto)%h%C(reset) - %s %C(bold blue)<%an>%Creset %C(green)(%ar)%Creset' --name-only "${SHA}..origin/main" -- $SPARSE_PATHS |
      awk '/^[0-9a-f]{7,}/ {print "\n"$0} !/^[0-9a-f]{7,}/ {print "    "$0}'
  fi
done < <(jq -c '.submodules[]' <"${CONFIG_FILE}")

# --- Apply submodule patches ---
bash "${GIT_ROOT}/scripts/patch-submodules.sh"
