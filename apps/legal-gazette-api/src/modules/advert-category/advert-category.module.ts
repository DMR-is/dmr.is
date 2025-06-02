import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertCategoryController } from './advert-category.controller'
import { AdvertCategoryModel } from './advert-category.model'
import { AdvertCategoryService } from './advert-category.service'
import { IAdvertCategoryService } from './advert-category.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertCategoryModel])],
  controllers: [AdvertCategoryController],
  providers: [
    {
      provide: IAdvertCategoryService,
      useClass: AdvertCategoryService,
    },
  ],
  exports: [IAdvertCategoryService],
})
export class AdvertCategoryModule {}
