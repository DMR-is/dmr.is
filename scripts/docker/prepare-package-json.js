// Prepares an app's generated `dist/package.json` for the `npm install` in its
// Docker image. Every app Dockerfile runs it before installing:
//
//   node prepare-package-json.js <app package.json> <root package.json>
//
// 1. Drops `@dmr.is/*` workspace dependencies. The build already bundled them,
//    and npm cannot resolve them from a registry.
// 2. Carries the root `resolutions` over as npm `overrides`. The image installs
//    with npm and no lockfile, and npm ignores Yarn's `resolutions`, so without
//    this every transitive security pin in the root package.json stops at the
//    build machine and the image installs whatever the parent pins instead.

const fs = require('fs')

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

const toOverrides = (resolutions, dependencies) => {
  const overrides = {}

  for (const [selector, spec] of Object.entries(resolutions)) {
    // URL and protocol specs (the pkg.pr.new vanilla-extract builds) are web
    // build tooling. No runtime image installs them.
    if (/^[a-z+]+:/.test(spec)) continue

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

    // npm refuses (EOVERRIDE) a top-level override that disagrees with a
    // direct dependency, and `$name` is how it spells "the direct spec".
    const value =
      names.length === 0 && dependencies[leaf] !== undefined ? `$${leaf}` : spec

    if (typeof node[leaf] === 'object') {
      node[leaf]['.'] = value
    } else {
      node[leaf] = value
    }
  }

  return overrides
}

const [appPath, rootPath] = process.argv.slice(2)
if (!appPath || !rootPath) {
  throw new Error(
    'Usage: node prepare-package-json.js <app package.json> <root package.json>',
  )
}

const app = JSON.parse(fs.readFileSync(appPath, 'utf8'))
const root = JSON.parse(fs.readFileSync(rootPath, 'utf8'))

app.dependencies = app.dependencies || {}
for (const name of Object.keys(app.dependencies)) {
  if (name.startsWith('@dmr.is/') && app.dependencies[name] === '*') {
    delete app.dependencies[name]
  }
}

app.overrides = toOverrides(root.resolutions || {}, app.dependencies)

fs.writeFileSync(appPath, JSON.stringify(app, null, 2))
