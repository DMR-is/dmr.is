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

  # Capture previous HEAD for later output
  PREV_HEAD=$(git -C "${SUBMODULE_PATH}" rev-parse HEAD)

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

  # New HEAD after checkout
  NEW_HEAD=$(git -C "${SUBMODULE_PATH}" rev-parse HEAD)

  echo -e "\nPrevious HEAD position was ${PREV_HEAD}"
  echo -e "HEAD is now at ${NEW_HEAD}\n"

  SPARSE_PATHS=$(echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | xargs echo)
  if [ -n "$SPARSE_PATHS" ]; then
    echo -e "🚀 Commits in ${NAME} affecting paths: $SPARSE_PATHS\n"
    # List commits quietly, focusing on the affected paths
    git -C "${SUBMODULE_PATH}" log --color=always --pretty=format:'%C(auto)%h%C(reset) - %s%C(auto)%d %C(bold blue)<%an>%Creset %C(green)(%ar)%Creset' "${SHA}..origin/main" -- $SPARSE_PATHS
  else
    echo "No sparse-checkout paths configured for ${NAME}."
  fi
done
