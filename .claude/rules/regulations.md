---
globs:
  - "apps/regulations-*/**/*"
alwaysApply: false
---

When working on Regulations API files, follow the guidance in:
`.claude/apps/regulations/CLAUDE.md`

Key reminders:

- Uses **Fastify** (NOT NestJS) - do not use decorators
- Standard logger (not `@dmr.is/logging`)
- Port: 3000
- Always consider temporal versioning in queries
