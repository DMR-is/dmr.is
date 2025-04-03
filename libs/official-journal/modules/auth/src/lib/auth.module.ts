import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { IAuthService } from './auth.service.interface'

@Module({
  imports: [],
  providers: [
    {
      provide: IAuthService,
      useClass: AuthService,
    },
  ],
  exports: [IAuthService],
})
export class AuthModule {}
