import {
  AdvertCategoriesModel,
  AdvertModel,
  AdvertStatusModel,
  CaseModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertController } from './controllers/advert.controller'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertStatusModel,
      AdvertCategoriesModel,
      CaseModel,
    ]),
  ],
  controllers: [AdvertController],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertModule {}
