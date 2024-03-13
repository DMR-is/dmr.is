#!/bin/bash

set -euo pipefail

GIT_ROOT=$(git rev-parse --show-toplevel)
CONFIG_FILE="${GIT_ROOT}/submodules/config.json"

jq -c '.submodules[]' <"${CONFIG_FILE}" | while read -r submodule; do
  NAME=$(echo "${submodule}" | jq -r '.name')
  SUBMODULE_PATH="${GIT_ROOT}/submodules/${NAME}"
  SHA=$(echo "${submodule}" | jq -r '.sha')

  # Ensure submodule is initialized and updated
  git submodule update --init "${SUBMODULE_PATH}"

  # Fetch updates
  git -C "${SUBMODULE_PATH}" fetch

  # Checkout to the specified SHA
  git -C "${SUBMODULE_PATH}" checkout "${SHA}"

  # Enable sparse-checkout
  git -C "${SUBMODULE_PATH}" config core.sparseCheckout true

  # Apply new sparse-checkout paths
  echo "${submodule}" | jq -r '.sparseCheckoutPaths[]' | while read -r path; do
    git -C "${SUBMODULE_PATH}" config --add core.sparseCheckoutPath "${path}"
  done

  # Refresh working directory
  git -C "${SUBMODULE_PATH}" read-tree -mu HEAD

  # List commits from the pinned SHA to the current HEAD in a more detailed and nicely formatted manner
  COMMIT_COUNT=$(git -C "${SUBMODULE_PATH}" rev-list --count "${SHA}..origin/main")

  if [ "$COMMIT_COUNT" -gt 0 ]; then
    echo -e "\n🚀 Commits in ${NAME} from ${SHA} (🔒) to origin/main (🎯):\n"
    git -C "${SUBMODULE_PATH}" log --pretty=format:'%C(auto)%h %Creset%s%C(auto)%d %Creset%C(bold blue)<%an>%Creset %C(green)(%ar)%Creset' "${SHA}..origin/main"
  else
    echo "No new commits in ${NAME} from ${SHA} to origin/main. 🤷"
  fi

done
