import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

export { IApplicationService } from './application.service.interface'
export { ApplicationService } from './application.service'
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
