import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ForeclosureModel } from '../../models/foreclosure.model'
import { ForeclosurePropertyModel } from '../../models/foreclosure-property.model'
import { AdvertProviderModule } from '../advert/advert.provider.module'
import { ForeclosureController } from './foreclosure.controller'
import { ForeclosureService } from './foreclosure.service'
import { IForeclosureService } from './foreclosure.service.interface'

@Module({
  imports: [
    AdvertProviderModule,
    SequelizeModule.forFeature([ForeclosureModel, ForeclosurePropertyModel]),
  ],
  controllers: [ForeclosureController],
  providers: [
    {
      provide: IForeclosureService,
      useClass: ForeclosureService,
    },
  ],
  exports: [IForeclosureService],
})
export class ForeclosureModule {}
