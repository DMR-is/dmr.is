import { Route } from '@dmr.is/decorators'

import { Controller, Inject } from '@nestjs/common'

import { IAuthService } from './auth.service.interface'

@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController {
  constructor(
    @Inject(IAuthService) private readonly authService: IAuthService,
  ) {}

  @Route({
    path: 'login',
    method: 'post',
    operationId: 'login',
  })
  async login() {
    return this.authService.getCodeVerification()
  }
}
