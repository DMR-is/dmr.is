import {
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertTypeModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeController } from './controllers/advert-type.controller'
import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertMainTypeModel,
      AdvertTypeModel,
      AdvertDepartmentModel,
    ]),
  ],
  providers: [
    {
      provide: IAdvertTypeService,
      useClass: AdvertTypeService,
    },
  ],
  controllers: [AdvertTypeController],
  exports: [IAdvertTypeService],
})
export class AdvertTypeModule {}
