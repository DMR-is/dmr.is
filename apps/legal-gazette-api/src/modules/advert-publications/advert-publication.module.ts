import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { TBRTransactionModel } from '../../models/tbr-transactions.model'
import { ISESModule } from '../aws/aws.module'
import { PdfModule } from '../pdf/pdf.module'
import { PriceCalculatorModule } from '../price-calculator/price-calculator.module'
import { TBRModule } from '../tbr/tbr.module'
import { AdvertPublishedListener } from './listeners/advert-published.listener'
import { AdvertPublicationController } from './advert-publication.controller'
import { AdvertPublicationService } from './advert-publication.service'
import { IAdvertPublicationService } from './advert-publication.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertPublicationModel,
      TBRTransactionModel,
    ]),
    TBRModule.forRoot({
      credentials: process.env.LG_TBR_CREDENTIALS!,
      officeId: process.env.LG_TBR_OFFICE_ID!,
      tbrBasePath: process.env.LG_TBR_PATH!,
    }),
    ISESModule,
    PriceCalculatorModule,
    PdfModule,
  ],
  controllers: [AdvertPublicationController],
  providers: [
    {
      provide: IAdvertPublicationService,
      useClass: AdvertPublicationService,
    },
    AdvertPublishedListener,
  ],
  exports: [IAdvertPublicationService],
})
export class AdvertPublicationModule {}
