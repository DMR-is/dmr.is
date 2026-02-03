# Legal Gazette Authorization Guide

Complete guide to authorization patterns in Legal Gazette API using `AuthorizationGuard`.

## Authorization Logic Matrix

The `AuthorizationGuard` handles both scope-based and admin-based access control in a single guard.

| Decorators | User Lookup? | Access Logic |
|------------|--------------|--------------|
| None | ❌ No | Allow (auth only via `TokenJwtAuthGuard`) |
| `@Scopes()` only | ❌ No | Check scope in JWT |
| `@AdminAccess()` only | ✅ Yes | Check user in UserModel table |
| `@AdminAccess()` + `@Scopes()` | ✅ Yes | Admin OR scope (OR logic) |

## Available Decorators

### Admin Decorator

```typescript
// From apps/legal-gazette-api/src/core/decorators/admin.decorator.ts
@AdminAccess()
```

- Requires user's `nationalId` to exist in `UserModel` table
- Triggers database lookup via `IUsersService.getUserByNationalId()`
- Used for internal admin users only

### Scope Decorators

```typescript
// From libs/shared/modules/src/lib/guards/auth/scope.decorator.ts

@PublicWebScopes()
// Requires '@logbirtingablad.is/logbirtingabladid' scope in JWT

@ApplicationWebScopes()
// Requires '@logbirtingablad.is/lg-application-web' scope in JWT

@PublicOrApplicationWebScopes()
// Requires EITHER of the above scopes in JWT
```

- Checks JWT `scope` claim only (no database lookup)
- Used for external clients with specific scopes
- Faster than admin check (no DB query)

## Controller Patterns

### Pattern 1: Admin-Only (Database Lookup)

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { AdminAccess } from '../../../core/decorators/admin.decorator'

@Controller({ path: 'admin/resources', version: '1' })
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess() // Requires user in UserModel
export class AdminResourceController {
  // All methods inherit @AdminAccess() from class level

  @Get()
  async findAll() { ... } // Admin only

  @Post()
  async create() { ... } // Admin only
}
```

**Access:**
- ✅ Users in `UserModel` table (database lookup)
- ❌ Users with scope but not in table
- ❌ Unauthenticated users

### Pattern 2: Scope-Only (No Database Lookup)

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { PublicWebScopes } from '@dmr.is/modules/guards/auth'

@Controller({ path: 'public/resources', version: '1' })
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicWebScopes() // Requires specific scope in JWT
export class PublicResourceController {
  // All methods check JWT scope only (no database lookup)

  @Get()
  async findAll() { ... } // Scope check only
}
```

**Access:**
- ✅ Users with `@logbirtingablad.is/logbirtingabladid` scope
- ❌ Admin users without the scope
- ❌ Users with wrong scope
- ❌ Unauthenticated users

### Pattern 3: Mixed (Admin OR Scope - OR Logic)

```typescript
import { Controller, UseGuards } from '@nestjs/common'
import { TokenJwtAuthGuard } from '@dmr.is/auth'
import { AuthorizationGuard } from '@dmr.is/modules/guards/authorization'
import { ApplicationWebScopes } from '@dmr.is/modules/guards/auth'
import { AdminAccess } from '../../../core/decorators/admin.decorator'

@Controller({ path: 'resources', version: '1' })
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@ApplicationWebScopes() // Scope option
@AdminAccess() // Admin option (OR logic)
export class ResourceController {
  // Admin users OR users with application-web scope

  @Get()
  async findAll() { ... } // Admin OR scope
}
```

**Access:**
- ✅ Admin users (in `UserModel`)
- ✅ Users with `@logbirtingablad.is/lg-application-web` scope
- ❌ Users with wrong scope and not admin
- ❌ Unauthenticated users

### Pattern 4: Method-Level Override

```typescript
@Controller({ path: 'resources', version: '1' })
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess() // Class-level: admin required
export class ResourceController {
  @Get()
  async findAll() { ... } // Inherits @AdminAccess() - admin only

  @ApplicationWebScopes() // Method-level override
  @Post()
  async create() { ... } // Admin OR application-web scope

  @PublicWebScopes() // Method-level override
  @Get('public')
  async getPublic() { ... } // Admin OR public-web scope
}
```

**Method-level decorators override class-level decorators.**

## Guard Implementation Details

```typescript
// Simplified logic from AuthorizationGuard

async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest()
  const user = request.user // From TokenJwtAuthGuard

  // Get decorators from controller/method
  const requiredScopes = this.reflector.getAllAndOverride<string[]>(
    SCOPES_KEY,
    [context.getHandler(), context.getClass()],
  )
  const requiresAdmin = this.reflector.getAllAndOverride<boolean>(
    ADMIN_KEY,
    [context.getHandler(), context.getClass()],
  )

  // No decorators = allow (auth only)
  if (!requiredScopes && !requiresAdmin) {
    return true
  }

  // Check scopes (if present)
  let hasScopeAccess = false
  if (requiredScopes) {
    hasScopeAccess = requiredScopes.some(scope =>
      user.scope?.includes(scope)
    )
  }

  // Check admin access (if decorator present)
  let hasAdminAccess = false
  if (requiresAdmin) {
    try {
      await this.usersService.getUserByNationalId(user.nationalId)
      hasAdminAccess = true
    } catch {
      hasAdminAccess = false
    }
  }

  // OR logic: Admin OR Scope
  if (requiresAdmin && requiredScopes) {
    return hasAdminAccess || hasScopeAccess
  }

  // Single decorator check
  if (requiresAdmin) {
    return hasAdminAccess
  }

  if (requiredScopes) {
    return hasScopeAccess
  }

  return false
}
```

## Database Lookup Behavior

### When Database Lookup Happens

- `@AdminAccess()` is present (class or method level)
- Guard calls `usersService.getUserByNationalId(nationalId)`
- If user found in `UserModel` → admin access granted
- If user not found → admin access denied

### When Database Lookup Does NOT Happen

- Only `@Scopes()` decorator present
- No decorators at all
- Guard only checks JWT `scope` claim

## Testing Authorization

See [testing-examples.md](testing-examples.md) for complete test examples.

**Key Testing Principles:**

1. Use **real Reflector** to read actual decorators
2. Mock only `IUsersService` for database lookups
3. Test each method's decorator configuration
4. Test user types: admin, public-web, application-web, unauthenticated

**Example Test Structure:**

```typescript
describe('ResourceController - Authorization', () => {
  let guard: AuthorizationGuard
  let reflector: Reflector // Real Reflector
  let usersService: jest.Mocked<IUsersService>

  const createMockContext = (
    user: any,
    method: keyof ResourceController,
  ): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ResourceController.prototype[method] as () => void,
    getClass: () => ResourceController,
  } as unknown as ExecutionContext)

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        Reflector, // Real Reflector
        { provide: IUsersService, useValue: mockUsersService },
      ],
    }).compile()

    guard = module.get(AuthorizationGuard)
    reflector = module.get(Reflector)
    usersService = module.get(IUsersService)
  })

  describe('Decorator verification', () => {
    it('should have @AdminAccess() on class', () => {
      const isAdmin = reflector.getAllAndOverride(ADMIN_KEY, [
        ResourceController,
      ])
      expect(isAdmin).toBe(true)
    })

    it('should have @ApplicationWebScopes() on create method', () => {
      const scopes = reflector.getAllAndOverride(SCOPES_KEY, [
        ResourceController.prototype.create,
        ResourceController,
      ])
      expect(scopes).toContain('@logbirtingablad.is/lg-application-web')
    })
  })

  describe('Authorization behavior', () => {
    it('should ALLOW admin users', async () => {
      const context = createMockContext(adminUser, 'findAll')
      expect(await guard.canActivate(context)).toBe(true)
      expect(usersService.getUserByNationalId).toHaveBeenCalled()
    })

    it('should ALLOW users with correct scope', async () => {
      const context = createMockContext(scopeUser, 'findAll')
      expect(await guard.canActivate(context)).toBe(true)
    })

    it('should DENY users without access', async () => {
      const context = createMockContext(unauthorizedUser, 'findAll')
      await expect(guard.canActivate(context)).rejects.toThrow()
    })
  })
})
```

## Swagger Configuration

Legal Gazette API has multiple Swagger UIs filtered by scope/admin:

```typescript
// apps/legal-gazette-api/src/swagger.config.ts

export const SWAGGER_CONFIGS = {
  // Shows all endpoints
  internal: {
    path: 'swagger',
    title: 'Legal Gazette Internal API',
  },

  // Shows only @PublicWebScopes() endpoints
  publicWeb: {
    path: 'public-swagger',
    title: 'Legal Gazette Public API',
  },

  // Shows only @ApplicationWebScopes() endpoints
  applicationWeb: {
    path: 'application-web-swagger',
    title: 'Legal Gazette Application API',
  },

  // Shows Island.is integration endpoints
  islandIs: {
    path: 'island-is-swagger',
    title: 'Legal Gazette Island.is Integration',
  },
}
```

Endpoints appear in Swagger UIs based on their decorators.

## Best Practices

1. **Prefer specific access over broad access:**
   - ✅ `@PublicWebScopes()` for public API
   - ❌ No decorators (allows all authenticated users)

2. **Use admin for internal tools only:**
   - ✅ Admin dashboard controllers
   - ❌ Public-facing endpoints

3. **Use scopes for external clients:**
   - ✅ Public web application
   - ✅ Application submission form

4. **Document access requirements in Swagger:**
   ```typescript
   @ApiOperation({
     summary: 'Create resource',
     description: 'Admin users or users with application-web scope',
   })
   ```

5. **Test authorization with real decorators:**
   - Use real `Reflector` in tests
   - Verify decorator configuration
   - Test all user types

6. **Consider performance:**
   - Scope-only checks are faster (no DB lookup)
   - Admin checks require database query
   - Cache admin status if making multiple requests

## Common Pitfalls

1. **Forgetting `AuthorizationGuard`:**
   ```typescript
   // ❌ Wrong - only checks authentication
   @UseGuards(TokenJwtAuthGuard)

   // ✅ Correct - checks both auth and authorization
   @UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
   ```

2. **Misunderstanding OR logic:**
   ```typescript
   // Admin OR scope (either grants access)
   @AdminAccess()
   @ApplicationWebScopes()

   // Not Admin AND scope (both required)
   ```

3. **Using wrong decorator:**
   ```typescript
   // ❌ Wrong - DMR-specific decorator
   @Scopes('custom-scope')

   // ✅ Correct - Use predefined decorators
   @PublicWebScopes()
   ```

4. **Not testing with real Reflector:**
   ```typescript
   // ❌ Wrong - mocked Reflector doesn't read real decorators
   { provide: Reflector, useValue: mockReflector }

   // ✅ Correct - real Reflector reads actual decorators
   Reflector
   ```

## Migration Guide

If converting from separate guards to `AuthorizationGuard`:

**Before:**
```typescript
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ResourceController { ... }
```

**After:**
```typescript
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class ResourceController { ... }
```

**Update tests to use real Reflector and check decorator configuration.**
