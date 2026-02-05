import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertModel } from '../../../../models/advert.model'
import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { TBRModule } from '../../../tbr/tbr.module'
import { PriceCalculatorProviderModule } from '../../calculator/price-calculator.provider.module'
import { PdfProviderModule } from '../../pdf/pdf.provider.module'
import { PublicationProviderModule } from '../publication.provider.module'
import { AdvertPublishedListener } from './advert-published.listener'

@Module({
  imports: [
    SequelizeModule.forFeature([TBRTransactionModel, AdvertModel]),
    AwsModule,
    PriceCalculatorProviderModule,
    PdfProviderModule,
    PublicationProviderModule,
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
  ],
  controllers: [],
  providers: [AdvertPublishedListener],
  exports: [AdvertPublishedListener],
})
export class PublicationListenerModule {}
