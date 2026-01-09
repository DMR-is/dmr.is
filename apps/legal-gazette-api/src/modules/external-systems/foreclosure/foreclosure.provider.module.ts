import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../../../models/advert.model'
import { ForeclosureModel } from '../../../models/foreclosure.model'
import { ForeclosurePropertyModel } from '../../../models/foreclosure-property.model'
import { AdvertProviderModule } from '../../advert/advert.provider.module'
import { ForeclosureService } from './foreclosure.service'
import { IForeclosureService } from './foreclosure.service.interface'

@Module({
  imports: [
    AdvertProviderModule,
    SequelizeModule.forFeature([
      ForeclosureModel,
      ForeclosurePropertyModel,
      AdvertModel,
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: IForeclosureService,
      useClass: ForeclosureService,
    },
  ],
  exports: [IForeclosureService],
})
export class ForeclosureProviderModule {}
