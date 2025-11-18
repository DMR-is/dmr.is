import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { UserModel } from '../../models/users.model'
import { TypeCategoriesProviderModule } from '../type-categories/type-categories.provider.module'
import { PriceCalculatorProviderModule } from './calculator/price-calculator.provider.module'
import { PdfProviderModule } from './pdf/pdf.provider.module'
import { AdvertPaymentTaskModule } from './tasks/payment/advert-payment.task.module'
import { PublishingTaskModule } from './tasks/publishing/publishing.task.module'
import { AdvertService } from './advert.service'
import { IAdvertService } from './advert.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      AdvertModel,
      AdvertPublicationModel,
    ]),

    PdfProviderModule,
    PriceCalculatorProviderModule,
    TypeCategoriesProviderModule,

    AdvertPaymentTaskModule,
    PublishingTaskModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IAdvertService,
      useClass: AdvertService,
    },
  ],
  exports: [IAdvertService],
})
export class AdvertProviderModule {}
