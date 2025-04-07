import {
  AdvertCorrectionModel,
  CaseModel,
} from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertCorrectionController } from './advert-correction.controller'
import { AdvertCorrectionService } from './advert-correction.service'
import { IAdvertCorrectionService } from './advert-correction.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, AdvertCorrectionModel])],
  controllers: [AdvertCorrectionController],
  providers: [
    {
      provide: IAdvertCorrectionService,
      useClass: AdvertCorrectionService,
    },
  ],
  exports: [IAdvertCorrectionService],
})
export class AdvertCorrectionModule {}
