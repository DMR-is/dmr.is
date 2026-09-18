import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

import { PublicRoute } from '../core/decorators/public-route.decorator'
import { PER_IP_THROTTLER } from '../core/guards/throttlers'

/**
 * Exempt from the per-IP bucket. The load balancer polls this from a small,
 * fixed set of addresses, so it would otherwise spend a shared allowance and —
 * worse — a flood that exhausted that bucket would take the health check down
 * with it, turning a rate-limit event into ECS replacing tasks.
 */
@SkipThrottle({ [PER_IP_THROTTLER]: true })
@Controller({ path: 'health', version: '1' })
@PublicRoute(
  'liveness probe — the load balancer sends no credential and has no identity',
)
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' }
  }
}
