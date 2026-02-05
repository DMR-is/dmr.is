import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'
import { createRedisCacheOptions } from '@dmr.is/utils/cache'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PriceCalculatorProviderModule } from '../calculator/price-calculator.provider.module'
import { PublicationService } from './publication.service'
import { IPublicationService } from './publication.service.interface'

@Module({
  imports: [
    createRedisCacheOptions('lg-advert-publications'),
    SequelizeModule.forFeature([
      AdvertModel,
      AdvertPublicationModel,
    ]),
    AwsModule,
    PriceCalculatorProviderModule,
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
