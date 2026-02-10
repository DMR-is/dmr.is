import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { createRedisCacheOptions } from '@dmr.is/utils/server/cacheUtils'

import { AdvertModel } from '../../../../models/advert.model'
import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { PgAdvisoryLockModule } from '../lock.module'
import { PublishingTaskService } from './publishing.task'
import { IPublishingTaskService } from './publishing.task.interface'

@Module({
  imports: [
    createRedisCacheOptions('lg-advert-publications'),
    SequelizeModule.forFeature([AdvertPublicationModel, AdvertModel]),
    PgAdvisoryLockModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IPublishingTaskService,
      useClass: PublishingTaskService,
    },
  ],
  exports: [IPublishingTaskService],
})
export class PublishingTaskModule {}
