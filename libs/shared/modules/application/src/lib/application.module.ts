import { AuthModule } from '@dmr.is/official-journal/modules/auth'

import { Module } from '@nestjs/common'

import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
  exports: [IApplicationService],
})
export class ApplicationModule {}
