# Import Conventions

This guide explains import path aliases and ordering conventions used across the DMR.is monorepo.

## Path Aliases

**Always use TypeScript path aliases** defined in `tsconfig.base.json`. Never use relative paths for shared libraries.

### Available Aliases

```typescript
// ✅ Correct - Use path aliases
import { LogMethod } from '@dmr.is/decorators'
import { CaseService } from '@dmr.is/modules'
import { getLogger } from '@dmr.is/logging'
import { Box, Stack } from '@island.is/island-ui/core'

// ❌ Wrong - Never use relative paths for shared libs
import { LogMethod } from '../../../libs/shared/decorators'
import { CaseService } from '../../../../libs/shared/modules'
```

### Common Path Aliases

| Alias | Location | Purpose |
|-------|----------|---------|
| `@dmr.is/modules` | `libs/shared/modules` | Reusable NestJS modules |
| `@dmr.is/db` | `libs/shared/db` | Sequelize configuration |
| `@dmr.is/auth` | `libs/shared/auth` | Authentication guards/strategies |
| `@dmr.is/logging` | `libs/shared/logging` | Winston logger (Node.js) |
| `@dmr.is/logging-next` | `libs/shared/logging-next` | Lightweight logger (Edge-compatible) |
| `@dmr.is/utils` | `libs/shared/utils` | Shared utilities |
| `@dmr.is/constants` | `libs/shared/constants` | Shared constants |
| `@dmr.is/shared/dto` | `libs/shared/dto` | Data transfer objects |
| `@dmr.is/shared/filters` | `libs/shared/filters` | NestJS exception filters |
| `@dmr.is/shared/interceptors` | `libs/shared/interceptors` | NestJS interceptors |
| `@dmr.is/shared/middleware` | `libs/shared/middleware` | Custom middleware |
| `@dmr.is/pipelines` | `libs/shared/pipelines` | Validation pipes |
| `@dmr.is/decorators` | `libs/shared/decorators` | Custom decorators |
| `@dmr.is/ui/components/*` | `libs/ui/components/*` | Shared React components |
| `@dmr.is/trpc/client/*` | `libs/trpc/client/*` | tRPC client utilities |
| `@island.is/island-ui/*` | `submodules/island.is/libs/island-ui/*` | Island.is UI components |

## Import Ordering

Enforced by `eslint-plugin-simple-import-sort`. Imports are automatically ordered in this sequence:

1. **Next.js imports** (`next/*`)
2. **External packages** (node_modules)
3. **NestJS packages** (`@nestjs/*`)
4. **DMR.is packages** (`@dmr.is/*`)
5. **Island.is packages** (`@island.is/*`)
6. **Relative imports** (`../`, `./`)

### Example (Correct Order)

```typescript
// 1. Next.js
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 2. External packages
import { z } from 'zod'
import { format } from 'date-fns'

// 3. NestJS
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

// 4. DMR.is
import { getLogger } from '@dmr.is/logging'
import { CaseService } from '@dmr.is/modules'
import { AdvertModel } from '@dmr.is/shared/models'

// 5. Island.is
import { Box, Stack } from '@island.is/island-ui/core'
import { Button } from '@island.is/island-ui/button'

// 6. Relative imports
import { AdvertForm } from './components/AdvertForm'
import { validateInput } from '../utils/validation'
```

### Auto-Fix Import Order

```bash
# Fix import order for a project
yarn nx lint <project> --fix

# Fix specific file
yarn nx lint <project> --fix --files=path/to/file.ts
```

## Module Boundaries

Nx enforces `@nx/enforce-module-boundaries` to prevent incorrect imports between apps and libraries.

### Rules

- **Apps** can import from **libs**, but not from other apps
- **Libs** can import from other libs based on dependency tags
- Always use path aliases (never relative paths outside the current app/lib)

### Common Violations

```typescript
// ❌ Wrong - App importing from another app
import { AdvertService } from 'apps/legal-gazette-api/src/modules/advert'

// ❌ Wrong - Relative path to shared library
import { getLogger } from '../../../libs/shared/logging'

// ✅ Correct - Path alias to shared library
import { getLogger } from '@dmr.is/logging'
```

## Best Practices

### Group Related Imports

```typescript
// ✅ Good - Grouped by purpose
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { getLogger } from '@dmr.is/logging'
import { LogMethod } from '@dmr.is/decorators'

import { AdvertModel } from '@dmr.is/shared/models'
import { CreateAdvertDto } from '@dmr.is/shared/dto'
```

### Avoid Barrel File Performance Issues

```typescript
// ⚠️  Can cause circular dependencies
import { ServiceA, ServiceB, ServiceC } from '@dmr.is/modules'

// ✅ Better - Specific imports
import { ServiceA } from '@dmr.is/modules/service-a'
import { ServiceB } from '@dmr.is/modules/service-b'
```

### Type-Only Imports

```typescript
// ✅ Use type-only imports when possible (better tree-shaking)
import type { NextRequest } from 'next/server'
import type { AdvertDto } from '@dmr.is/shared/dto'
```

## Troubleshooting

### Error: "Cannot find module '@dmr.is/...'"

**Cause**: Path alias not defined in `tsconfig.json`

**Solution**: Check `tsconfig.base.json` and ensure the path is listed:
```json
{
  "compilerOptions": {
    "paths": {
      "@dmr.is/logging": ["libs/shared/logging/src/index.ts"]
    }
  }
}
```

### Error: "Projects cannot be imported by this project"

**Cause**: Nx module boundary violation

**Solution**: Use the correct path alias or add the dependency to `project.json`:
```json
{
  "implicitDependencies": ["shared-utils"]
}
```

### ESLint Not Auto-Fixing Import Order

**Cause**: Conflicting ESLint rules or parse errors

**Solution**:
1. Fix any TypeScript errors first
2. Run `yarn nx lint <project> --fix`
3. Check `.eslintrc.yml` for conflicting rules

---

**Related Documentation**:
- [NestJS Conventions](./nestjs.md)
- [Next.js Conventions](./nextjs.md)
- Main [CLAUDE.md](../CLAUDE.md)
