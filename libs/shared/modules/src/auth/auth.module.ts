import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthService } from './auth.service'

export { AuthService } from './auth.service'

@Module({
  imports: [LoggingModule],
  controllers: [],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
