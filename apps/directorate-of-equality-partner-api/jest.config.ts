/* eslint-disable */
export default {
  displayName: 'directorate-of-equality-partner-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/directorate-of-equality-partner-api',
}
