import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CategoryModel } from '../category/category.model'
import { StatusModel } from '../status/status.model'
import { AdvertController } from './controllers/advert.controller'
import { AdvertCategoryController } from './controllers/advert-category.controller'
import { AdvertStatusController } from './controllers/advert-status.controller'
import { AdvertModel } from './advert.model'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, StatusModel, CategoryModel]),
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
