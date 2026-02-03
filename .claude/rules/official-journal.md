---
globs:
  - "apps/official-journal-*/**/*"
  - "libs/**/official-journal*/**/*"
alwaysApply: false
---

When working on Official Journal files, follow the guidance in:
`.claude/apps/official-journal/CLAUDE.md`

Key reminders:

- Uses **Pages Router** (not App Router)
- Run codegen after API changes: `yarn nx run official-journal-web:update-schema`
- Ports: Main API=4000, Admin=4001, Application=4002, Web=3000
