export default {
  displayName: 'auth',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // Bare on purpose: inline options REPLACE the root `.swcrc` instead of
  // merging with it. See the header in `.swcrc`.
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@noble)/)', // Transform jose and noble packages
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/auth',
}
