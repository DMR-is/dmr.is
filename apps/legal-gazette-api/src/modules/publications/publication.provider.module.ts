import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertPublicationModel,
      TBRTransactionModel,
    ]),
    AwsModule,
    PriceCalculatorModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IPublicationService,
      useClass: PublicationService,
    },
  ],
  exports: [IPublicationService],
})
export class PublicationProviderModule {}
