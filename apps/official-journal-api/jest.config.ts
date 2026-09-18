export default {
  displayName: 'official-journal-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/official-journal-api',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
}
