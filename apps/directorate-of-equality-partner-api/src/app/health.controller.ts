import { Controller, Get } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'

import { PER_IP_THROTTLER } from '../core/guards/throttlers'

/**
 * Exempt from the per-IP bucket. The load balancer polls this from a small,
 * fixed set of addresses, so it would otherwise spend a shared allowance and —
 * worse — a flood that exhausted that bucket would take the health check down
 * with it, turning a rate-limit event into a service replacing its tasks.
 */
@SkipThrottle({ [PER_IP_THROTTLER]: true })
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' }
  }
}
