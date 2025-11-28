import { SetMetadata } from '@nestjs/common'

export const ADMIN_KEY = 'admin'

/**
 * Decorator to mark endpoints or controllers as admin-only.
 * Users must exist in the UserModel table to be considered admins.
 *
 * @example
 * ```typescript
 * @AdminOnly()
 * @Controller('admin')
 * export class AdminController { ... }
 * ```
 *
 * @example
 * ```typescript
 * @AdminOnly()
 * @Get('sensitive-data')
 * async getSensitiveData() { ... }
 * ```
 */
export const AdminOnly = () => SetMetadata(ADMIN_KEY, true)
