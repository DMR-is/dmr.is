---
globs:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.spec.tsx"
  - "**/*.test.tsx"
alwaysApply: false
---

When working on test files, follow the guidance in:
`.claude/conventions/testing.md`

Key reminders:

- Use `--testFile=<path>` for faster single-file testing
- Follow NestJS test module setup patterns
