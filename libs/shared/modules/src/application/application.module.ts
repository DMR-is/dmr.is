import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [LoggingModule, AuthModule],
  controllers: [ApplicationController],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
})
export class ApplicationModule {}
