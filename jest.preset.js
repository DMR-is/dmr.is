const nxPreset = require('@nx/jest/preset').default

module.exports = { ...nxPreset, moduleDirectories: ['node_modules'] }
