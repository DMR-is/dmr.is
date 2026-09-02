/* eslint-disable */
export default {
  displayName: 'doe-modules',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  // No inline options: @swc/jest then reads the root `.swcrc`, which already
  // sets `decoratorMetadata` / `legacyDecorator` / `keepClassNames` for Nest.
  // Inline options REPLACE `.swcrc` rather than merging with it, so passing
  // even one silently drops the rest.
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/directorate-of-equality/modules',
}
