import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { AuthService } from './auth.service'
import { IAuthService } from './auth.service.interface'

export { AuthService } from './auth.service'
export { IAuthService } from './auth.service.interface'

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: IAuthService,
      useClass: AuthService,
    },
  ],
  exports: [IAuthService],
})
export class AuthModule {}
