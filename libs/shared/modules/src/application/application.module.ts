import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { ApplicationService } from './application.service'

@Module({
  imports: [LoggingModule],
  controllers: [],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
