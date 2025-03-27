import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

import { AdvertModel } from '@dmr.is/official-journal/models'
@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel]),
    AwsModule,
    PriceModule,
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
