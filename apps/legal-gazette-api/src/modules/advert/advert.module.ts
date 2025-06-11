import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertCategoryModel } from '../advert-category/advert-category.model'
import { AdvertStatusModel } from '../advert-status/advert-status.model'
import { AdvertController } from './controllers/advert.controller'
import { AdvertCategoryController } from './controllers/advert-category.controller'
import { AdvertStatusController } from './controllers/advert-status.controller'
import { AdvertModel } from './advert.model'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertStatusModel,
      AdvertCategoryModel,
    ]),
  ],
  controllers: [
    AdvertController,
    AdvertCategoryController,
    AdvertStatusController,
  ],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertModule {}
