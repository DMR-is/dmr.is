import { Module } from '@nestjs/common'

import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'
import { AuthService } from '@dmr.is/official-journal/modules/auth'

@Module({
  imports: [AuthService],
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
