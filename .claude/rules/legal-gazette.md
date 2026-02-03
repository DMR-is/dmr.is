---
globs:
  - "apps/legal-gazette-*/**/*"
  - "libs/**/legal-gazette*/**/*"
alwaysApply: false
---

When working on Legal Gazette files, follow the guidance in:
`.claude/apps/legal-gazette/CLAUDE.md`

Key reminders:

- Next.js apps: Use `@dmr.is/logging-next` (ESLint enforced)
- API: Use `@dmr.is/logging`
- Ports: API=4100, Web=4200, Application=4300, Public=4400
