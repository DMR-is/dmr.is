---
globs:
  - "**/*.controller.ts"
  - "**/*.service.ts"
  - "**/*.module.ts"
  - "**/*.guard.ts"
  - "**/*.interceptor.ts"
alwaysApply: false
---

When working on NestJS files, follow the guidance in:
`.claude/conventions/nestjs.md`

Key reminders:

- Two-module pattern: providers module + controller module
- Extend `BaseModel` for Sequelize models
- No async in module `register`/`forRoot` - use `useFactory`
