import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { SharedCaseModule } from '../case/case.module'
import { CommentModule } from '../comment/comment.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

export { IApplicationService } from './application.service.interface'
export { ApplicationService } from './application.service'

@Module({
  imports: [
    LoggingModule,
    AuthModule,
    forwardRef(() => SharedCaseModule),
    forwardRef(() => CommentModule),
  ],
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
