#!/bin/bash

CONFIG_FILE="submodules/island.is/tsconfig.base.json"

mkdir -p "$(dirname "$CONFIG_FILE")"

cat > "$CONFIG_FILE" << 'EOF'
{
  "extends": "../../tsconfig.base.json"
}
EOF

echo "✅ Created $CONFIG_FILE"
