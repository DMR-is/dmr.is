import {
  AdvertCorrectionModel,
  CaseModel,
} from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { IAdvertCorrectionService } from './advert-correction.service.interface'
import { AdvertCorrectionService } from './advert-correction.service'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel, AdvertCorrectionModel])],
  controllers: [],
  providers: [
    {
      provide: IAdvertCorrectionService,
      useClass: AdvertCorrectionService,
    },
  ],
  exports: [IAdvertCorrectionService],
})
export class AdvertCorrectionModule {}
