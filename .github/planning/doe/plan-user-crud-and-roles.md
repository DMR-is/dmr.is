# DoE — User CRUD + Role-Based Access

**App:** `directorate-of-equality-api`
**Branch:** `doe/allow-get-all-users` (or a new branch off it)
**Status:** Implemented. 19 new unit tests pass, full suite green (238/238), `tsc` clean, `lint` clean. Pending: run migration against dev DB (`yarn nx run directorate-of-equality-api:migrate`).

## Summary

Add Create / Update / Delete endpoints to the existing users controller, introduce a `role` column on `doe_user` (`ADMIN` | `EDITOR`), and gate write endpoints so only ADMINs can call them. Read endpoints stay available to both roles. The existing `AdminGuard` already enforces that the caller is an active DoE user — that requirement is unchanged. A new `RequireAdminRoleGuard` adds the ADMIN-only check on top, stacked after `AdminGuard` on write routes.

Delete is **soft delete** (sets `is_active = false`) to preserve FK references from `report.reviewer_user_id`, `report_event.actor_user_id`, `report_event.assigned_user_id`, `report_comment.author_user_id`.

---

## Decisions (confirmed)

| Question | Decision |
|---|---|
| DELETE semantics | Soft delete — sets `is_active = false`. Hard delete would either fail (FK) or destroy audit history. |
| Backfill role for existing users | `ADMIN` — the current small reviewer team retains full access; new users get role set explicitly on create. |
| Guard design | New `RequireAdminRoleGuard`, stacked after `AdminGuard`. `AdminGuard` stays as-is and remains the source of `request.adminUser`. |
| Role storage | Postgres enum `doe_user_role_enum` (`ADMIN`, `EDITOR`). Matches existing enum conventions (`report_status_enum`, etc.). |

## Open considerations

- **Self-edit guardrails**: should an ADMIN be allowed to demote themselves to EDITOR, or soft-delete themselves? Defaulting to **no** — the service layer rejects both with a `BadRequestException` to prevent accidental lockout. Easy to relax later.
- **Last ADMIN guardrail**: deny demoting / deactivating the last remaining active ADMIN. Same rationale as above. Service-layer check.
- **Email + nationalId uniqueness**: enforced by existing DB unique constraints. The service catches `UniqueConstraintError` and returns `409 Conflict` with a clear message.

---

## Phase 1 — Database migration

**File:** `apps/directorate-of-equality-api/db/migrations/m-20260520-doe-user-role.js`

```sql
BEGIN;

CREATE TYPE doe_user_role_enum AS ENUM ('ADMIN', 'EDITOR');

ALTER TABLE doe_user
  ADD COLUMN role doe_user_role_enum NOT NULL DEFAULT 'ADMIN';

-- New users created via the API get role set explicitly; the default exists
-- only so existing rows backfill cleanly. Future inserts should still pass
-- role through the create endpoint.

COMMIT;
```

**Down:**
```sql
BEGIN;
ALTER TABLE doe_user DROP COLUMN role;
DROP TYPE doe_user_role_enum;
COMMIT;
```

**Verify:** `yarn nx run directorate-of-equality-api:migrate` then `\d doe_user` shows the column; rollback works cleanly on dev.

---

## Phase 2 — Model + DTO

**Files to modify:**

- `apps/directorate-of-equality-api/src/modules/user/models/user.model.ts`
  - Add `DoeUserRole` enum export (`'ADMIN' | 'EDITOR'`).
  - Add to `UserAttributes` + `UserCreateAttributes`.
  - Add `@Column({ type: DataType.ENUM('ADMIN', 'EDITOR'), allowNull: false })` for `role`.
  - Include `role` in `fromModel`.

- `apps/directorate-of-equality-api/src/modules/user/dto/user.dto.ts`
  - Add `role: DoeUserRole` field with `@ApiProperty({ enum: ... })`.

**New files:**

- `dto/create-user.body.dto.ts` — `nationalId`, `firstName`, `lastName`, `email`, optional `phone`, required `role`. Validators: `kennitala` for nationalId, `IsEmail`, `IsEnum` for role, `IsOptional` + `IsPhoneNumber('IS')` for phone.
- `dto/update-user.body.dto.ts` — all optional: `firstName`, `lastName`, `email`, `phone`, `role`, `isActive`. **Excludes `nationalId`** (immutable identifier).

**Verify:** `yarn nx run directorate-of-equality-api:typecheck` passes.

---

## Phase 3 — Guard

**New file:** `apps/directorate-of-equality-api/src/core/guards/admin-role/require-admin-role.guard.ts`

```ts
@Injectable()
export class RequireAdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const adminUser = request.adminUser as UserModel | undefined

    if (!adminUser) {
      throw new InternalServerErrorException(
        'RequireAdminRoleGuard ran without AdminGuard — fix the @UseGuards order',
      )
    }

    if (adminUser.role !== DoeUserRole.ADMIN) {
      throw new ForbiddenException('Admin role required')
    }

    return true
  }
}
```

**Spec:** `require-admin-role.guard.spec.ts` — three cases:
1. ADMIN role → returns true.
2. EDITOR role → throws `ForbiddenException`.
3. Missing `request.adminUser` → throws `InternalServerErrorException` (catches misordered guards).

**Note:** `AdminGuard` is unchanged. It already enforces `isActive: true` via `resolveAdminUser` ([authorization.service.ts:65-67](apps/directorate-of-equality-api/src/modules/authorization/authorization.service.ts#L65-L67)), so the "only active users" requirement is already in place.

---

## Phase 4 — Service

**File:** `apps/directorate-of-equality-api/src/modules/user/user.service.ts` (+ interface)

Add methods:

- `createUser(input: CreateUserBodyDto): Promise<UserDto>`
  - Inserts the row, returns the DTO.
  - Catches `UniqueConstraintError` → throws `ConflictException` indicating which field collided.
- `updateUser(id: string, input: UpdateUserBodyDto, actor: UserModel): Promise<UserDto>`
  - `findByPkOrThrow(id)`, applies patch, saves.
  - Last-ADMIN guard: if patch sets `role: 'EDITOR'` or `isActive: false` and the target is currently ADMIN+active, count remaining active ADMINs — reject if this would drop it to zero.
  - Self-demotion guard: reject if `actor.id === id` and patch sets `role: 'EDITOR'` or `isActive: false`.
- `softDeleteUser(id: string, actor: UserModel): Promise<void>`
  - Sets `isActive = false`.
  - Idempotent: if already inactive, returns 204 without error.
  - Self-delete guard + last-ADMIN guard (same as update).

---

## Phase 5 — Controller

**File:** `apps/directorate-of-equality-api/src/modules/user/user.controller.ts`

```ts
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class UserController {
  // GET /me   — both roles
  // GET /     — both roles

  @Post()
  @UseGuards(RequireAdminRoleGuard)
  @DoeResponse({ operationId: 'createUser', type: UserDto })
  createUser(@Body() body: CreateUserBodyDto) { ... }

  @Patch(':id')
  @UseGuards(RequireAdminRoleGuard)
  @DoeResponse({ operationId: 'updateUser', type: UserDto, include404: true })
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserBodyDto,
    @CurrentAdminUser() actor: UserModel,
  ) { ... }

  @Delete(':id')
  @UseGuards(RequireAdminRoleGuard)
  @HttpCode(204)
  @DoeResponse({ operationId: 'deleteUser', include404: true })
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdminUser() actor: UserModel,
  ) { ... }
}
```

Class-level `@UseGuards(TokenJwtAuthGuard, AdminGuard)` covers all routes (reads + writes both require an active DoE user). Method-level `@UseGuards(RequireAdminRoleGuard)` adds the ADMIN-only check on writes — Nest runs class guards first, then method guards, so the order is correct.

**Note on `@CurrentAdminUser()`:** check whether this decorator already exists in `libs/shared/decorators` — if not, add a tiny one that pulls `request.adminUser`. (Or just use `@Req()` inline if a decorator is over-engineered for two call sites.)

**Module update:** `user.api.module.ts` — register `RequireAdminRoleGuard` in `providers`.

---

## Phase 6 — Tests

| File | Coverage |
|---|---|
| `user.service.spec.ts` | create happy path + email/nationalId conflicts; update happy path + last-ADMIN reject + self-demote reject; soft-delete happy path + idempotent + self-delete reject + last-ADMIN reject |
| `require-admin-role.guard.spec.ts` | three cases listed in Phase 3 |
| `admin.guard.spec.ts` | unchanged — existing coverage already proves active-only enforcement |

Use `/unit-tests` skill if convenient.

---

## Files touched

**New:**
- `db/migrations/m-20260520-doe-user-role.js`
- `src/modules/user/dto/create-user.body.dto.ts`
- `src/modules/user/dto/update-user.body.dto.ts`
- `src/core/guards/admin-role/require-admin-role.guard.ts`
- `src/core/guards/admin-role/require-admin-role.guard.spec.ts`
- `src/modules/user/user.service.spec.ts` (if missing)

**Modified:**
- `src/modules/user/models/user.model.ts` — add role
- `src/modules/user/dto/user.dto.ts` — expose role
- `src/modules/user/user.service.ts` (+ `.interface.ts`) — add CUD methods
- `src/modules/user/user.controller.ts` — wire endpoints + guards
- `src/modules/user/user.api.module.ts` — register guard

---

## Security considerations

- Both new guards enforce active + role at the controller boundary; service methods additionally enforce last-ADMIN + self-edit invariants so a future caller (jobs, scripts) can't bypass them.
- `nationalId` is immutable on update — prevents identity swap on an existing row.
- National IDs are auto-masked in logs ([CLAUDE.md](.claude/CLAUDE.md)) so audit logs don't leak PII.

## Test checklist

- [ ] Migration up + down cleanly on dev DB
- [ ] Existing users have role=ADMIN after migration
- [ ] Active ADMIN can create / update / delete users
- [ ] Active EDITOR can read but receives 403 on write endpoints
- [ ] Inactive user receives 403 on all endpoints (existing AdminGuard behavior)
- [ ] Last active ADMIN cannot be demoted or deactivated
- [ ] User cannot demote / deactivate themselves
- [ ] Duplicate email or nationalId on create returns 409
- [ ] Soft-delete is idempotent (deleting twice returns 204 both times)
