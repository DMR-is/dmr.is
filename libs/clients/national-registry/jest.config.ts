export default {
  displayName: 'clients-national-registry',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // Bare on purpose: inline options REPLACE the root `.swcrc` instead of
  // merging with it. See the header in `.swcrc`.
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/clients/national-registry',
}
