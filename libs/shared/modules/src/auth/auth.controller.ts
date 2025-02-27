import { Controller, Inject, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'

import { IAuthService } from './auth.service.interface'

@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController {
  constructor(
    @Inject(IAuthService) private readonly authService: IAuthService,
  ) {}

  @Post('login')
  @ApiOperation({ operationId: 'login' })
  async login() {
    return (await this.authService.getCodeVerification()).unwrap()
  }
}
