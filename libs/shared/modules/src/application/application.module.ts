import { LoggingModule } from '@dmr.is/logging'

import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AuthModule } from '../auth/auth.module'
import { SharedCaseModule } from '../case/case.module'
import {} from '../case/case.module'
import { CommentModule } from '../comment/comment.module'
import { UtilityModule } from '../utility/utility.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

export { IApplicationService } from './application.service.interface'
export { ApplicationService } from './application.service'

import { ApplicationUserModule } from '../application-user/application-user.module'
import { AttachmentsModule } from '../attachments/attachments.module'
import caseModels from '../case/models'
import commentModels from '../comment/models'
import advertModels from '../journal/models'
import { S3Module } from '../s3/s3.module'
import { SignatureModule } from '../signature/signature.module'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...caseModels,
      ...advertModels,
      ...commentModels,
    ]),
    S3Module,
    LoggingModule,
    AuthModule,
    AttachmentsModule,
    ApplicationUserModule,
    SignatureModule,
    forwardRef(() => SharedCaseModule),
    forwardRef(() => CommentModule),
    forwardRef(() => UtilityModule),
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
