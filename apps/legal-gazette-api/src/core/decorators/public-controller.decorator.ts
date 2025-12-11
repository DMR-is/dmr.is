import { SetMetadata } from '@nestjs/common'

export const PUBLIC_CONTROLLER_KEY = 'publicController'

/**
 * Decorator to mark a controller as public (no authentication required).
 * Use this for endpoints that should be accessible without any auth.
 *
 * NOTE: This decorator bypasses the ESLint rule that requires auth decorators.
 * Only use this for genuinely public endpoints.
 *
 * @example
 * ```typescript
 * @PublicController()
 * @Controller('health')
 * export class HealthController { ... }
 * ```
 */
export const PublicController = () => SetMetadata(PUBLIC_CONTROLLER_KEY, true)
