import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModule } from '../advert/advert.module'
import { ForeclosureController } from './foreclosure.controller'
import { ForeclosureModel } from '../../models/foreclosure.model'
import { ForeclosureService } from './foreclosure.service'
import { IForeclosureService } from './foreclosure.service.interface'
import { ForeclosurePropertyModel } from '../../models/foreclosure-property.model'

@Module({
  imports: [
    AdvertModule,
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
