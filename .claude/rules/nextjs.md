---
globs:
  - "**/app/**/*.tsx"
  - "**/app/**/*.ts"
  - "**/pages/**/*.tsx"
  - "**/pages/**/*.ts"
alwaysApply: false
---

When working on Next.js files, follow the guidance in:
`.claude/conventions/nextjs.md`

Key reminders:

- Legal Gazette: App Router + `@dmr.is/logging-next`
- Official Journal: Pages Router + `@dmr.is/logging`
- Server Components: No hooks, can be async
- Client Components: Mark with `'use client'`
