#!/bin/bash

# Resolve repo root from script location (not git, which breaks inside submodules)
GIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- Create tsconfig.base.json override ---
#
# The sparse checkout only materialises libs/**, so island.is's own
# tsconfig.base.json is never checked out. Its per-lib tsconfigs extend
# ../../tsconfig.base.json, so give them one that points back at ours.

CONFIG_FILE="${GIT_ROOT}/submodules/island.is/tsconfig.base.json"

mkdir -p "$(dirname "$CONFIG_FILE")"

cat > "$CONFIG_FILE" << 'EOF'
{
  "extends": "../../tsconfig.base.json"
}
EOF

echo "Created $CONFIG_FILE"
