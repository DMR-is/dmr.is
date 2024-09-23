import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'
import { IAuthService } from './auth.service.interface'

export * from './auth.controller'

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
