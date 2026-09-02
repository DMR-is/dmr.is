export default {
  displayName: 'auth',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|@noble)/)', // Transform jose and noble packages
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/auth',
}
