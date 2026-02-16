#!/bin/bash

# Resolve repo root from script location (not git, which breaks inside submodules)
GIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- 1. Create tsconfig.base.json override ---

CONFIG_FILE="${GIT_ROOT}/submodules/island.is/tsconfig.base.json"

mkdir -p "$(dirname "$CONFIG_FILE")"

cat > "$CONFIG_FILE" << 'EOF'
{
  "extends": "../../tsconfig.base.json"
}
EOF

echo "Created $CONFIG_FILE"

# --- 2. Apply patch files from submodules/patches/ ---

PATCHES_DIR="${GIT_ROOT}/submodules/patches"

if [ -d "$PATCHES_DIR" ]; then
  for patch_file in "$PATCHES_DIR"/*.patch; do
    [ -f "$patch_file" ] || continue
    patch_name=$(basename "$patch_file")

    # Check if patch can be applied (not already applied)
    if git -C "${GIT_ROOT}/submodules/island.is" apply --check "$patch_file" 2>/dev/null; then
      git -C "${GIT_ROOT}/submodules/island.is" apply "$patch_file"
      echo "Applied patch: $patch_name"
    else
      echo "Patch already applied or not applicable: $patch_name (skipping)"
    fi
  done
fi
