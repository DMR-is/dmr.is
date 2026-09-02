export default {
  preset: '../../../jest.preset.js',
  displayName: 'shared-modules',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/modules',
}
