import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { ApplicationModel } from '../../../models/application.model'
import { AdvertProviderModule } from '../../advert/advert.provider.module'
import { RecallApplicationService } from './recall-application.service'
import { IRecallApplicationService } from './recall-application.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, ApplicationModel]),
    AdvertProviderModule,
  ],
  providers: [
    {
      provide: IRecallApplicationService,
      useClass: RecallApplicationService,
    },
  ],
  exports: [IRecallApplicationService],
})
export class RecallApplicationProviderModule {}
