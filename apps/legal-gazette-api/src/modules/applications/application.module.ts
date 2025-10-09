import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertModel } from '../advert/advert.model'
import { AdvertModule } from '../advert/advert.module'
import { CaseModel } from '../case/case.model'
import { CategoryModel } from '../category/category.model'
import { SettlementModel } from '../settlement/settlement.model'
import { ApplicationController } from './controllers/application.controller'
import { ApplicationModel } from './application.model'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'

@Module({
  imports: [
    AdvertModule,
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
