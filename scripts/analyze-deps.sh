#!/usr/bin/env bash
#
# analyze-deps.sh — scan workspace packages for missing/unused external dependencies
#
# For each workspace, scans src/ for import/require statements, identifies external
# (non-relative, non-@dmr.is/*, non-@island.is/*) packages, and cross-references
# against the package's own package.json.
#
# Usage: ./scripts/analyze-deps.sh [workspace-path]
#   If no argument, scans all workspaces.
#
# Limitations:
# - Dynamic imports (import()) are not detected
# - Re-exports from barrel files may cause false negatives
# - Bare Node built-in names (path, fs, etc.) without node: prefix will show as missing

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Node built-ins that may be imported without the node: prefix
NODE_BUILTINS="assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|http2|https|module|net|os|path|perf_hooks|process|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|v8|vm|worker_threads|zlib"

# Extract package names from a package.json's deps/devDeps/peerDeps
get_declared_deps() {
  local pkg_json="$1"
  node -e "
    const pkg = require('$pkg_json');
    const deps = new Set([
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ]);
    deps.forEach(d => console.log(d));
  "
}

# Scan source files for external imports
get_imported_packages() {
  local src_dir="$1"
  if [ ! -d "$src_dir" ]; then
    return
  fi

  # Match: import ... from 'pkg' / require('pkg') / import 'pkg'
  grep -rEoh \
    "(from|require\(|import)\s*['\"]([^'\"./][^'\"]*)['\"]" \
    "$src_dir" \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
    2>/dev/null \
  | sed -E "s/(from|require\(|import)\s*['\"]([^'\"]*)['\"].*/\2/" \
  | sed -E 's|^(@[^/]+/[^/]+).*|\1|; t; s|^([^/]+).*|\1|' \
  | sort -u \
  | grep -v '^@dmr\.is/' \
  | grep -v '^@island\.is/' \
  | grep -v '^\.' \
  | grep -v '^node:' \
  | grep -vE "^($NODE_BUILTINS)$" \
  || true
}

analyze_workspace() {
  local ws_path="$1"
  local pkg_json="$ws_path/package.json"
  local src_dir="$ws_path/src"

  if [ ! -f "$pkg_json" ]; then
    return
  fi

  local ws_name
  ws_name=$(node -e "console.log(require('$pkg_json').name || '$ws_path')")

  local declared
  declared=$(get_declared_deps "$pkg_json")

  local imported
  imported=$(get_imported_packages "$src_dir")

  if [ -z "$imported" ]; then
    return
  fi

  local missing=""
  local unused=""

  # Find missing: imported but not declared
  while IFS= read -r pkg; do
    if ! echo "$declared" | grep -qx "$pkg"; then
      missing="${missing}  ${pkg}\n"
    fi
  done <<< "$imported"

  # Find unused: declared but not imported (only non-@types, non-implicit)
  while IFS= read -r pkg; do
    [ -z "$pkg" ] && continue
    # Skip @types — they don't appear in imports
    [[ "$pkg" == @types/* ]] && continue
    # Skip @dmr.is — workspace deps
    [[ "$pkg" == @dmr.is/* ]] && continue
    # Skip implicit deps that don't appear in imports
    case "$pkg" in
      reflect-metadata|tslib|pg|@nestjs/platform-express|react-dom) continue ;;
    esac

    if ! echo "$imported" | grep -qx "$pkg"; then
      unused="${unused}  ${pkg}\n"
    fi
  done <<< "$declared"

  if [ -n "$missing" ] || [ -n "$unused" ]; then
    echo "=== $ws_name ==="
    if [ -n "$missing" ]; then
      echo "MISSING (imported but not in package.json):"
      echo -e "$missing"
    fi
    if [ -n "$unused" ]; then
      echo "UNUSED (in package.json but not imported):"
      echo -e "$unused"
    fi
    echo ""
  fi
}

if [ $# -gt 0 ]; then
  analyze_workspace "$ROOT_DIR/$1"
else
  # Get all workspace paths from yarn
  while IFS= read -r line; do
    ws_location=$(echo "$line" | node -e "process.stdin.on('data', d => { const o = JSON.parse(d); if(o.location !== '.') console.log(o.location); })")
    if [ -n "$ws_location" ]; then
      analyze_workspace "$ROOT_DIR/$ws_location"
    fi
  done < <(cd "$ROOT_DIR" && yarn workspaces list --json 2>/dev/null)
fi
