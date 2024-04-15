import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

@Controller({
  version: '1',
})
export class HealthController {
  @Get('')
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint.',
  })
  health(): Promise<string> {
    return Promise.resolve('OK')
  }
}
