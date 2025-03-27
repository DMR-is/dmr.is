import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'
import { AdvertMainTypeModel } from './models/advert-main-type.model'
import { AdvertTypeModel } from './models/advert-type.model'

@Module({
  imports: [SequelizeModule.forFeature([AdvertMainTypeModel, AdvertTypeModel])],
  providers: [
    {
      provide: IAdvertTypeService,
      useClass: AdvertTypeService,
    },
  ],
  controllers: [],
  exports: [IAdvertTypeService],
})
export class AdvertTypeModule {}
