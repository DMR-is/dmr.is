# DMR.is Monorepo - AI Coding Agent Instructions

## Architecture Overview

This is an **Nx monorepo** managing multiple applications for Iceland's DMR (Department of Official Journals). Two main product families exist:

- **Official Journal** (`official-journal-*`): Government publication system with web interface, APIs, and admin tools
- **Legal Gazette** (`legal-gazette-*`): Legal notices system with application web, public web, and API

### Apps Structure
- `apps/*/src/` - Application code (Next.js web apps or NestJS APIs)
- `apps/*/project.json` - Nx build/serve/test targets (read this for available commands)
- `libs/` - Shared libraries organized by domain (`@dmr.is/*` and `@island.is/*` imports)

## Development Workflows

### Starting Applications

**Never** run `npm` or `yarn` commands directly. Always use Nx:

```bash
# Legal Gazette full stack
yarn lg:init              # Start DB, run migrations, seed data (first time)
nx serve legal-gazette-api
nx serve legal-gazette-web

# Official Journal
nx run official-journal-api:dev-init  # Initialize with demo data
nx serve official-journal-web
nx serve official-journal-admin-api
```

### Code Generation

Web apps require **codegen before build/serve** (dependency in `project.json`):

```bash
# Update OpenAPI schema from running API, then generate client
nx run official-journal-web:update-openapi-schema
nx run official-journal-web:codegen
```

### Database Migrations

Legal Gazette uses **Sequelize CLI**:

```bash
nx run legal-gazette-api:migrate  # Run migrations
nx run legal-gazette-api:seed     # Seed data
```

Database connection exposed via AWS Session Manager or Docker Compose (see `apps/*/docker-compose.yml`).

## Code Organization Patterns

### Module Structure (NestJS)

Two-module pattern for separation of concerns:
- `*.provider.module.ts` - Service providers, imports, models
- `*.controller.module.ts` - Controllers, guards, minimal imports

Example: `libs/shared/modules/src/case/case.module.ts` exports services, models, interfaces.

### Import Path Aliases

Use TypeScript path aliases defined in `tsconfig.base.json`:

```typescript
import { LogMethod } from '@dmr.is/decorators'
import { CaseService } from '@dmr.is/modules'
import { Box, Stack } from '@island.is/island-ui/core'
```

**Never** use relative paths across package boundaries. Always use `@dmr.is/*` or `@island.is/*`.

### Import Ordering (enforced by ESLint)

1. Next.js imports (`next/*`)
2. External packages
3. NestJS packages (`@nestjs/*`)
4. DMR.is packages (`@dmr.is/*`)
5. Island.is packages (`@island.is/*`)
6. Relative imports (`../`, `./`)

Run `nx lint <project>` to auto-fix ordering.

## Critical Conventions

### Custom ESLint Rules (`eslint-local-rules.js`)

1. **`require-reduce-defaults`**: Always provide initial value to `.reduce()`
2. **`disallow-kennitalas`**: No real Icelandic SSNs in code (prevents PII leaks)
3. **`no-async-module-init`**: No async `register`, `forRoot`, etc. in NestJS modules (causes startup failures)

### API Documentation

Legal Gazette API has **multiple Swagger endpoints** per audience:
- `/swagger` - Internal API
- `/island-is-swagger` - Island.is integration
- `/public-swagger` - Public web API
- `/application-web-swagger` - Application submissions

Check `apps/legal-gazette-api/src/swagger.config.ts` for configuration.

### Sequelize Models

Models in Legal Gazette use custom decorators from `@dmr.is/shared/models/base`:
- `@BaseTable({ tableName: LegalGazetteModels.X })` - table naming
- Include models in `AppModule` imports explicitly (no `autoLoadModels`)

## External Dependencies

### Git Submodules

Island.is UI components sourced from sparse checkout:

```bash
# Auto-updated by git hooks (post-checkout, post-merge)
# Manual update: ./.gitscripts/checkout-submodules.sh
```

Config: `submodules/config.json` pins SHA and paths (`libs/shared` from island.is repo).

### AWS Services (DEV Environment)

Expose via Session Manager (see `scripts/run-pg-proxy.sh`, `scripts/run-xroad-proxy.sh`):
- **Database**: Port 5432 (credentials in AWS Secrets Manager)
- **X-Road**: Port 8000 (env: `XROAD_ISLAND_IS_PATH`, `XROAD_DMR_CLIENT`)

## Testing & Building

```bash
nx test <project>        # Run Jest tests
nx lint <project>        # ESLint with auto-fix
nx tsc <project>         # Type-check without emit
nx build <project>       # Build for production
```

Build Next.js apps with `output: 'standalone'` (Dockerfile copies from `dist/.next/standalone`).

## Common Pitfalls

1. **Codegen missing**: If Next.js build fails with "module not found" for API clients, run `nx run <app>:codegen`
2. **Wrong port**: Legal Gazette API defaults to 4100, Official Journal to 4000 (check `process.env.*_PORT`)
3. **Module boundaries**: Nx enforces `@nx/enforce-module-boundaries` - never import `libs/*/src` directly
4. **Async module init**: Do NOT use `async` on NestJS module lifecycle methods - causes silent startup failures

## Key Files to Reference

- `tsconfig.base.json` - All path aliases
- `nx.json` - Task runner config, caching
- `package.json` scripts - Shortcut commands (`lg:*`, `ojoi-*`)
- `.eslintrc.yml` - Import ordering, naming conventions
- `apps/*/project.json` - Available Nx targets per app
