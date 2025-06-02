import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeController } from './advert-type.controller'
import { AdvertTypeModel } from './advert-type.model'
import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([AdvertTypeModel])],
  controllers: [AdvertTypeController],
  providers: [
    {
      provide: IAdvertTypeService,
      useClass: AdvertTypeService,
    },
  ],
  exports: [IAdvertTypeService],
})
export class AdvertTypeModule {}
