#!/bin/bash

set -euo pipefail

GIT_ROOT=$(git rev-parse --show-toplevel)
CONFIG_FILE="${GIT_ROOT}/submodules/config.json"

while read -r submodule; do
  NAME=$(echo "${submodule}" | jq -r '.name')
  SUBMODULE_PATH="${GIT_ROOT}/submodules/${NAME}"
  SHA=$(echo "${submodule}" | jq -r '.sha')

  # Quietly ensure submodule is initialized and updated
  git submodule update --init --quiet "${SUBMODULE_PATH}"

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
  #
  # The generated tsconfig.base.json stub would be "not up to date" and block
  # its own removal; patch-submodules.sh recreates it at the end of this script.
  rm -f "${SUBMODULE_PATH}/tsconfig.base.json"
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
  GITLINK=$(git -C "${GIT_ROOT}" rev-parse "HEAD:submodules/${NAME}" 2>/dev/null || echo '')
  if [ -n "${GITLINK}" ] && [ "${GITLINK#"${SHA}"}" = "${GITLINK}" ]; then
    echo "⚠️  ${NAME}: submodules/config.json pins ${SHA} but the gitlink is ${GITLINK}." >&2
  fi

  # Informational: what has landed upstream in the paths we actually consume.
  SPARSE_PATHS=$(echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | xargs)
  if [ -n "$SPARSE_PATHS" ] && git -C "${SUBMODULE_PATH}" rev-parse --verify --quiet origin/main >/dev/null; then
    echo -e "🚀 Commits in ${NAME} from ${SHA} to origin/main affecting paths:\n"
    git -C "${SUBMODULE_PATH}" log --color=always --pretty=format:'%C(auto)%h%C(reset) - %s %C(bold blue)<%an>%Creset %C(green)(%ar)%Creset' --name-only "${SHA}..origin/main" -- $SPARSE_PATHS |
      awk '/^[0-9a-f]{7,}/ {print "\n"$0} !/^[0-9a-f]{7,}/ {print "    "$0}'
  fi
done < <(jq -c '.submodules[]' <"${CONFIG_FILE}")

# --- Apply submodule patches ---
bash "${GIT_ROOT}/scripts/patch-submodules.sh"
