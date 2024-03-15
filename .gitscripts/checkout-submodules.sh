#!/bin/bash

set -euo pipefail

GIT_ROOT=$(git rev-parse --show-toplevel)
CONFIG_FILE="${GIT_ROOT}/submodules/config.json"

jq -c '.submodules[]' <"${CONFIG_FILE}" | while read -r submodule; do
  NAME=$(echo "${submodule}" | jq -r '.name')
  SUBMODULE_PATH="${GIT_ROOT}/submodules/${NAME}"
  SHA=$(echo "${submodule}" | jq -r '.sha')

  # Quietly ensure submodule is initialized and updated
  git submodule update --init --quiet "${SUBMODULE_PATH}"

  # Fetch updates quietly
  git -C "${SUBMODULE_PATH}" fetch --quiet

  # Checkout to the specified SHA quietly
  git -C "${SUBMODULE_PATH}" checkout --quiet "${SHA}"

  # Enable sparse-checkout
  git -C "${SUBMODULE_PATH}" config core.sparseCheckout true

  # Apply new sparse-checkout paths
  echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | while read -r path; do
    git -C "${SUBMODULE_PATH}" config --add core.sparseCheckoutPath "${path}"
  done

  # Refresh working directory quietly
  git -C "${SUBMODULE_PATH}" read-tree -mu --quiet HEAD

  SPARSE_PATHS=$(echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | xargs)
  if [ -n "$SPARSE_PATHS" ]; then
    echo -e "🚀 Commits in ${NAME} from ${SHA} to origin/main affecting paths:\n"
    git -C "${SUBMODULE_PATH}" log --color=always --pretty=format:'%C(auto)%h%C(reset) - %s %C(bold blue)<%an>%Creset %C(green)(%ar)%Creset' --name-only "${SHA}..origin/main" -- $SPARSE_PATHS |
      awk '/^[0-9a-f]{7,}/ {print "\n"$0} !/^[0-9a-f]{7,}/ {print "    "$0}'
  else
    echo "No sparse-checkout paths configured for ${NAME}."
  fi
done
