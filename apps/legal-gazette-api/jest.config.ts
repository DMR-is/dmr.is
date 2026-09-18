/* eslint-disable */
export default {
  displayName: 'legal-gazette-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  setupFiles: ['<rootDir>/src/test-env.ts'],
  coverageDirectory: '../../coverage/apps/legal-gazette-api',
}
