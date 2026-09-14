/* eslint-disable */
export default {
  displayName: 'directorate-of-equality-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  // Bare on purpose: inline options REPLACE the root `.swcrc` instead of
  // merging with it. See the header in `.swcrc`.
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/directorate-of-equality-api',
}
