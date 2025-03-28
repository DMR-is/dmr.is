import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

import { AdvertModel } from '@dmr.is/official-journal/models'
import { AuthModule } from '@dmr.is/official-journal/modules/auth'
import { PriceModule } from '@dmr.is/official-journal/modules/price'
import { SignatureModule } from '@dmr.is/official-journal/modules/signature'
import { UtilityModule } from '@dmr.is/official-journal/modules/utility'
import { AWSModule } from '@dmr.is/shared/modules/aws'
import { AttachmentModule } from '@dmr.is/official-journal/modules/attachment'
import { CommentModule } from '@dmr.is/official-journal/modules/comment'
import { CaseModule } from '@dmr.is/official-journal/modules/case'
@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel]),
    AWSModule,
    PriceModule,
    AuthModule,
    AttachmentModule,
    SignatureModule,
    CommentModule,
    forwardRef(() => CaseModule),
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
