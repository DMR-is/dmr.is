import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/shared-modules'

import { AdvertModel } from '../../../../models/advert.model'
import { ApplicationModel } from '../../../../models/application.model'
import { TBRTransactionModel } from '../../../../models/tbr-transactions.model'
import { TBRModule } from '../../../tbr/tbr.module'
import { PriceCalculatorProviderModule } from '../../calculator/price-calculator.provider.module'
import { PdfProviderModule } from '../../pdf/pdf.provider.module'
import { PublicationProviderModule } from '../publication.provider.module'
import { AdvertPublishedListener } from './advert-published.listener'
import { DivisionEndingPublishedListener } from './division-ending-published.listener'

@Module({
  imports: [
    SequelizeModule.forFeature([
      TBRTransactionModel,
      AdvertModel,
      ApplicationModel,
    ]),
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
  providers: [AdvertPublishedListener, DivisionEndingPublishedListener],
  exports: [AdvertPublishedListener, DivisionEndingPublishedListener],
})
export class PublicationListenerModule {}
