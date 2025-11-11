import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients/national-registry'

import { AdvertModel } from '../advert/advert.model'
import { AdvertModule } from '../advert/advert.module'
import { ApplicationModel } from '../applications/application.model'
import { ApplicationService } from '../applications/application.service'
import { IApplicationService } from '../applications/application.service.interface'
import { IslandIsApplicationController } from '../applications/controllers/island-is-application.controller'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { SettlementModel } from '../settlement/settlement.model'

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
