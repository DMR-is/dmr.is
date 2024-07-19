import { LogMethod } from '@dmr.is/decorators'

import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

@Controller({
  version: '1',
  path: 'health',
})
export class HealthController {
  constructor() {}

  @Get()
  @ApiTags('health')
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint.',
  })
  @LogMethod()
  health(): Promise<string> {
    return Promise.resolve('OK')
  }
}
