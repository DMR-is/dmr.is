export default {
  preset: './jest.preset.js',
  rootDir: '../..',
  roots: ['<rootDir>/libs/logging'],
  transform: {
    '^.+\\.[tj]sx?$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '<rootDir>/coverage/libs/logging',
  globals: {},
  displayName: 'logging',
}
