const nxPreset = require('@nx/jest/preset').default

module.exports = {
  ...nxPreset,
  moduleDirectories: ['node_modules'],

  // Prevent mock state from leaking between tests
  clearMocks: true,
  restoreMocks: true,
}
