import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertTypeService } from './advert-type.service'
import { IAdvertTypeService } from './advert-type.service.interface'

import {
  AdvertDepartmentModel,
  AdvertMainTypeModel,
  AdvertTypeModel,
} from '@dmr.is/official-journal/models'
import { AdvertTypeController } from './controllers/advert-type.controller'

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
