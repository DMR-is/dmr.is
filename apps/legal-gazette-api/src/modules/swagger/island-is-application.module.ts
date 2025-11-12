import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { AdvertModel } from '../../models/advert.model'
import { ApplicationModel } from '../../models/application.model'
import { CaseModel } from '../../models/case.model'
import { CategoryModel } from '../../models/category.model'
import { SettlementModel } from '../../models/settlement.model'
import { AdvertModule } from '../advert/advert.module'
import { ApplicationService } from '../applications/application.service'
import { IApplicationService } from '../applications/application.service.interface'
import { IslandIsApplicationController } from '../applications/controllers/island-is-application.controller'
import { BaseEntityModule } from '../base-entity/base-entity.module'

@Module({
  imports: [
    NationalRegistryModule,
    SequelizeModule.forFeature([
      CaseModel,
      ApplicationModel,
      CategoryModel,
      SettlementModel,
      AdvertModel,
    ]),
    BaseEntityModule,
    AdvertModule,
  ],
  controllers: [IslandIsApplicationController],
  providers: [
    {
      provide: IApplicationService,
      useClass: ApplicationService,
    },
  ],
  exports: [],
})
export class IslandIsApplicationModule {}
