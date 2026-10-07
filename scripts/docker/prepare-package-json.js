// Prepares an app's generated `dist/package.json` for the `npm install` in its
// Docker image. Every app Dockerfile runs it before installing:
//
//   node prepare-package-json.js package.json
//
// 1. Drops `@dmr.is/*` workspace dependencies. The build already bundled them,
//    and npm cannot resolve them from a registry.
// 2. Carries the `resolutions` Nx copies into the generated package.json over
//    as npm `overrides`. The image installs with npm and no lockfile, and npm
//    ignores Yarn's `resolutions`, so without this every transitive security
//    pin stops at the build machine and the image installs whatever the parent
//    pins instead.
//
// Anything it cannot translate faithfully throws, so a pin fails the image
// build rather than silently going missing from it.

const fs = require('fs')

// The pkg.pr.new vanilla-extract builds are web build tooling that no image
// installs at runtime, so they are left out on purpose. Any other URL or
// protocol spec is unexpected and must be translated by hand.
const SKIPPED_SPEC_PREFIXES = ['https://pkg.pr.new/']

// `@scope/a/b` -> ['@scope/a', 'b']: a Yarn selector is a parent chain.
const splitSelector = (selector) => {
  const parts = selector.split('/')
  const names = []
  for (let i = 0; i < parts.length; i++) {
    names.push(
      parts[i].startsWith('@') ? `${parts[i]}/${parts[++i]}` : parts[i],
    )
  }
  return names
}

// Returns the npm spec for a Yarn one, or null when it is skipped.
const toNpmSpec = (selector, spec) => {
  if (SKIPPED_SPEC_PREFIXES.some((prefix) => spec.startsWith(prefix))) {
    return null
  }

  // `npm:1.2.3` is Yarn's explicit-registry form of a plain range.
  const plain = spec.startsWith('npm:') ? spec.slice('npm:'.length) : spec
  if (/^[a-z+]+:/i.test(plain) || plain.includes('@')) {
    throw new Error(
      `Cannot carry resolution "${selector}": "${spec}" into npm overrides. ` +
        'Translate it in scripts/docker/prepare-package-json.js.',
    )
  }

  return plain
}

// Mutates `dependencies`: a top-level resolution that names a direct
// dependency also replaces that dependency's spec, the way Yarn applies it,
// so the image can never install below the pin.
const toOverrides = (resolutions, dependencies) => {
  const overrides = {}

  for (const [selector, rawSpec] of Object.entries(resolutions)) {
    const spec = toNpmSpec(selector, rawSpec)
    if (spec === null) continue

    const names = splitSelector(selector)
    const leaf = names.pop()

    let node = overrides
    for (const parent of names) {
      const current = node[parent]
      if (typeof current !== 'object') {
        node[parent] = current === undefined ? {} : { '.': current }
      }
      node = node[parent]
    }

    let value = spec
    if (names.length === 0 && dependencies[leaf] !== undefined) {
      // npm refuses (EOVERRIDE) a top-level override that disagrees with a
      // direct dependency, and `$name` is how it spells "the direct spec".
      dependencies[leaf] = spec
      value = `$${leaf}`
    }

    if (typeof node[leaf] === 'object') {
      node[leaf]['.'] = value
    } else {
      node[leaf] = value
    }
  }

  return overrides
}

const preparePackageJson = (app) => {
  if (!app.resolutions) {
    throw new Error(
      'The generated package.json has no `resolutions`. Nx copies them from ' +
        'the root package.json; without them the image would install no pins.',
    )
  }

  const dependencies = { ...app.dependencies }
  for (const name of Object.keys(dependencies)) {
    if (name.startsWith('@dmr.is/') && dependencies[name] === '*') {
      delete dependencies[name]
    }
  }

  const overrides = toOverrides(app.resolutions, dependencies)
  return { ...app, dependencies, overrides }
}

module.exports = { preparePackageJson }

if (require.main === module) {
  const [path] = process.argv.slice(2)
  if (!path) {
    throw new Error('Usage: node prepare-package-json.js <package.json>')
  }

  const app = JSON.parse(fs.readFileSync(path, 'utf8'))
  fs.writeFileSync(path, JSON.stringify(preparePackageJson(app), null, 2))
}
