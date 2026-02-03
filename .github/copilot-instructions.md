# DMR.is Monorepo - GitHub Copilot Instructions

## 📚 Main Documentation

**All project documentation is located in the `.claude/` directory.**

👉 **Start here**: [`.claude/CLAUDE.md`](../.claude/CLAUDE.md)

The main CLAUDE.md file provides:
- Quick orientation and navigation
- Links to app-specific guides
- Links to technical convention guides
- Links to code generation skills
- Getting started instructions

## Documentation Structure

### App-Specific Guides

Choose the guide for the application family you're working on:

- **[Legal Gazette Apps](../.claude/apps/legal-gazette/CLAUDE.md)** - `legal-gazette-*` (tRPC, App Router, authorization)
- **[Official Journal Apps](../.claude/apps/official-journal/CLAUDE.md)** - `official-journal-*` (OpenAPI, Pages Router, legacy patterns)
- **[Regulations API](../.claude/apps/regulations/CLAUDE.md)** - `regulations-api` (Fastify, temporal versioning)

### Technical Conventions

Reference these for specific technical patterns:

- **[Logging](../.claude/conventions/logging.md)** - Which logger to use where
- **[NestJS](../.claude/conventions/nestjs.md)** - Controllers, services, modules, testing
- **[Next.js](../.claude/conventions/nextjs.md)** - App Router vs Pages Router, Server vs Client Components
- **[Imports](../.claude/conventions/imports.md)** - Path aliases and import ordering
- **[Testing](../.claude/conventions/testing.md)** - Jest patterns, test commands

### Detailed Architecture Guides

- **[Next.js Architecture Guide](./nextjs-architecture-guide.md)** - Complete App Router vs Pages Router patterns

## Quick Reference

### Technology Stack

- **Monorepo**: Nx
- **Backend**: NestJS (most APIs), Fastify (Regulations), Sequelize ORM, PostgreSQL
- **Frontend**: Next.js (App Router for new apps, Pages Router for legacy)
- **APIs**: tRPC (Legal Gazette), OpenAPI-generated clients (Official Journal)
- **Package Manager**: Yarn 4.7.0 (npm disabled)
- **Node**: 20.15.0

### Essential Commands

**Always use Nx via yarn**:

```bash
# Start applications
yarn nx serve legal-gazette-api
yarn nx serve legal-gazette-web

# Run tests
yarn nx test <project>
yarn nx test <project> --testFile=<path/to/file.spec.ts>

# Database migrations
yarn nx run legal-gazette-api:migrate

# Code generation (Official Journal only)
yarn nx run official-journal-web:update-schema
```

### Critical Conventions

**Logging**:
- NestJS APIs → `@dmr.is/logging`
- Next.js App Router → `@dmr.is/logging-next`
- Never use `console.log`

**Imports**:
- Always use TypeScript path aliases (`@dmr.is/*`, `@island.is/*`)
- Never use relative paths for shared libraries

**NestJS**:
- Two-module pattern (provider + controller modules)
- No `async` in module lifecycle methods (`forRoot`, `register`)

## Getting Started

1. **Initial Setup**:
   ```bash
   ./.gitscripts/checkout-submodules.sh
   yarn
   ```

2. **Start Development**:
   ```bash
   # Legal Gazette
   yarn nx run legal-gazette-api:dev-init    # First time only
   yarn nx serve legal-gazette-api
   yarn nx serve legal-gazette-web           # Separate terminal

   # Official Journal
   yarn nx run official-journal-api:dev-init  # First time only
   yarn nx serve official-journal-api
   yarn nx serve official-journal-web         # Separate terminal
   ```

3. **Run Tests**:
   ```bash
   yarn nx test legal-gazette-api
   yarn nx test legal-gazette-web
   ```

## Support

For detailed information on any topic, refer to the documentation in `.claude/` directory:
- Main overview: [`.claude/CLAUDE.md`](../.claude/CLAUDE.md)
- App guides: `.claude/apps/<product>/CLAUDE.md`
- Conventions: `.claude/conventions/<topic>.md`

---

**Remember**: This is a production system serving Iceland's government. Always prioritize security, data privacy, and code quality.
