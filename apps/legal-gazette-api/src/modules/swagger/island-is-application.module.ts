import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '@dmr.is/modules'

import { ApplicationModel } from '../applications/application.model'
import { ApplicationService } from '../applications/application.service'
import { IApplicationService } from '../applications/application.service.interface'
import { IslandIsApplicationController } from '../applications/controllers/island-is-application.controller'
import { BaseEntityModule } from '../base-entity/base-entity.module'
import { CaseModel } from '../case/case.model'

@Module({
  imports: [
    SequelizeModule.forFeature([CaseModel, ApplicationModel, AdvertModel]),
    BaseEntityModule,
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
