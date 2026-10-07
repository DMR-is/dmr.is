// Run with `node --test scripts/docker/*.test.js`. CI runs it in the
// deploy-scripts job.

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')

const { preparePackageJson } = require('./prepare-package-json')

const prepare = (resolutions, dependencies = {}) =>
  preparePackageJson({ name: 'app', dependencies, resolutions })

test('drops bundled @dmr.is workspace dependencies only', () => {
  const result = prepare(
    {},
    {
      '@dmr.is/logging': '*',
      '@dmr.is/pinned': '1.0.0',
      express: '^5.0.0',
    },
  )

  assert.deepEqual(result.dependencies, {
    '@dmr.is/pinned': '1.0.0',
    express: '^5.0.0',
  })
})

test('carries a top-level pin over as a plain override', () => {
  assert.deepEqual(prepare({ undici: '7.29.1' }).overrides, {
    undici: '7.29.1',
  })
})

test('nests parent-scoped selectors, scoped packages included', () => {
  const { overrides } = prepare({
    'nx/axios': '1.20.0',
    'nx/brace-expansion': '^5.0.10',
    '@nestjs/swagger/js-yaml': '5.4.1',
  })

  assert.deepEqual(overrides, {
    nx: { axios: '1.20.0', 'brace-expansion': '^5.0.10' },
    '@nestjs/swagger': { 'js-yaml': '5.4.1' },
  })
})

test('keeps a parent pin next to its children under "."', () => {
  const { overrides } = prepare({ nx: '22.7.8', 'nx/axios': '1.20.0' })

  assert.deepEqual(overrides, { nx: { '.': '22.7.8', axios: '1.20.0' } })
})

// npm's `$name` means "the app's own direct spec". Left alone, a lower direct
// spec would win over the pin in the image while Yarn kept the pin in dev.
test('raises a direct dependency to the pin before referencing it', () => {
  const result = prepare({ multer: '2.4.0' }, { multer: '2.3.0' })

  assert.equal(result.dependencies.multer, '2.4.0')
  assert.deepEqual(result.overrides, { multer: '$multer' })
})

test('strips the npm: prefix from a plain range', () => {
  assert.deepEqual(prepare({ moment: 'npm:2.31.0' }).overrides, {
    moment: '2.31.0',
  })
})

test('skips the pkg.pr.new vanilla-extract builds', () => {
  const { overrides } = prepare({
    '@vanilla-extract/css':
      'https://pkg.pr.new/RJWadley/vanilla-extract/@vanilla-extract/css@edaedbb',
  })

  assert.deepEqual(overrides, {})
})

test('throws on a spec it cannot translate rather than dropping it', () => {
  assert.throws(() => prepare({ lodash: 'patch:lodash@4.18.1#./fix.patch' }), {
    message: /lodash/,
  })
  assert.throws(() => prepare({ foo: 'npm:bar@1.0.0' }), { message: /foo/ })
  assert.throws(() => prepare({ foo: 'https://example.com/foo.tgz' }), {
    message: /foo/,
  })
})

test('throws when the generated package.json carries no resolutions', () => {
  assert.throws(() => preparePackageJson({ name: 'app', dependencies: {} }), {
    message: /resolutions/,
  })
})

// The real root resolutions must all translate, or every image build fails.
test('translates every resolution in the root package.json', () => {
  const root = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'),
  )

  assert.doesNotThrow(() => prepare(root.resolutions))
})
