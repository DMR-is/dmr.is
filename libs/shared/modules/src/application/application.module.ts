import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SharedCaseModule } from '../case/case.module'
import { HealthController } from '../health/health.controller'
import { HealthModule } from '../health/health.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [LoggingModule, AuthModule, SharedCaseModule, HealthModule],
  controllers: [ApplicationController, HealthController],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
})
export class ApplicationModule {}
