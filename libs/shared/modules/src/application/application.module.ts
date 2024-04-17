import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { ApplicationService } from './application.service'

@Module({
  imports: [LoggingModule, AuthModule],
  controllers: [],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
