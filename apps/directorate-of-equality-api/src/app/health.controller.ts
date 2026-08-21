import { Controller, Get } from '@nestjs/common'

import { PublicRoute } from '../core/decorators/public-route.decorator'

@Controller({ path: 'health', version: '1' })
@PublicRoute(
  'liveness probe — load balancers send no token and have no identity',
)
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' }
  }
}
