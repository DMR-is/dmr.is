import { SetMetadata } from '@nestjs/common'

export const ADMIN_KEY = 'admin'

/**
 * Decorator to mark endpoints or controllers as admin-only.
 * Users must exist in the UserModel table to be considered admins.
 *
 * @example
 * ```typescript
 * @AdminAccess()
 * @Controller('admin')
 * export class AdminController { ... }
 * ```
 *
 * @example
 * ```typescript
 * @AdminAccess()
 * @Get('sensitive-data')
 * async getSensitiveData() { ... }
 * ```
 */
export const AdminAccess = () => SetMetadata(ADMIN_KEY, true)
