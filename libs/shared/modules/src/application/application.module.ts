import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SharedCaseModule } from '../case/case.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

export { IApplicationService } from './application.service.interface'

@Module({
  imports: [LoggingModule, AuthModule, forwardRef(() => SharedCaseModule)],
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
