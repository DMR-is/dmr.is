import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AuthModule } from '../auth/auth.module'
import { SharedCaseModule } from '../case/case.module'
import {} from '../case/case.module'
import { CommentModuleV2 } from '../comment/v2'
import { UtilityModule } from '../utility/utility.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

export { IApplicationService } from './application.service.interface'
export { ApplicationService } from './application.service'

import { AttachmentsModule } from '../attachments/attachments.module'
import { AwsModule } from '../aws/aws'
import caseModels from '../case/models'
import commentModels from '../comment/v1/models'
import advertModels from '../journal/models'
import { PriceModule } from '../price/price.module'
import { SignatureModule } from '../signature/signature.module'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ...caseModels,
      ...advertModels,
      ...commentModels,
    ]),
    AwsModule,
    PriceModule,
    LoggingModule,
    AuthModule,
    AttachmentsModule,
    SignatureModule,
    CommentModuleV2,
    forwardRef(() => SharedCaseModule),
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
