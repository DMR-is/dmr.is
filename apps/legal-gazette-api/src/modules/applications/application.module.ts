import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { AdvertModel } from '../../models/advert.model'
import { AdvertModule } from '../advert/advert.module'
import { CaseModel } from '../../models/case.model'
import { CategoryModel } from '../../models/category.model'
import { SettlementModel } from '../../models/settlement.model'
import { ApplicationController } from './controllers/application.controller'
import { ApplicationModel } from '../../models/application.model'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [
    AdvertModule,
    NationalRegistryModule,
    SequelizeModule.forFeature([
      CaseModel,
      AdvertModel,
      ApplicationModel,
      SettlementModel,
      CategoryModel,
    ]),
  ],
  controllers: [ApplicationController],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
  exports: [],
})
export class ApplicationModule {}
