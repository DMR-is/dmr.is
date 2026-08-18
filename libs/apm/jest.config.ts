/* eslint-disable */
export default {
  preset: './jest.preset.js',
  rootDir: '../..',
  roots: ['<rootDir>/libs/apm'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/libs/apm/tsconfig.spec.json' },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  coverageDirectory: '<rootDir>/coverage/libs/apm',
  globals: {},
  displayName: 'apm',
}
