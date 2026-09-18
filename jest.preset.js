const nxPreset = require('@nx/jest/preset').default

// sanitize-html 2.17.6+ depends on htmlparser2 12, and that entire parser
// stack now ships as ESM-only via "type": "module". Node 24 can require() an
// ESM module, so the built services are unaffected, but jest's own module
// registry cannot -- these have to be transformed rather than ignored the way
// node_modules normally is.
const ESM_ONLY_DEPS = [
  'htmlparser2',
  'dom-serializer',
  'domhandler',
  'domutils',
  'domelementtype',
  'entities',
]

module.exports = {
  ...nxPreset,
  moduleDirectories: ['node_modules'],

  transformIgnorePatterns: [`node_modules/(?!.*(${ESM_ONLY_DEPS.join('|')}))`],

  // Prevent mock state from leaking between tests
  clearMocks: true,
  restoreMocks: true,
}
