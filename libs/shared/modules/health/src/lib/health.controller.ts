import { LogMethod } from '@dmr.is/decorators'

import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

@Controller({
  version: '1',
  path: 'health',
})
export class HealthController {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint.',
  })
  @LogMethod()
  health(): Promise<string> {
    return Promise.resolve('OK')
  }
}
