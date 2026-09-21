/* eslint-disable */
export default {
  displayName: 'doe-shared',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // Bare on purpose: inline options REPLACE the root `.swcrc` instead of
  // merging with it. See the header in `.swcrc`.
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/directorate-of-equality/shared',
}
