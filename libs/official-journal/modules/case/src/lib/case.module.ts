import {
  CaseCategoriesModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { ApplicationModule } from '@dmr.is/shared/modules/application'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseService } from './case.service'
import { ICaseService } from './case.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      CaseStatusModel,
      CaseCommunicationStatusModel,
      CaseTagModel,
      CaseCategoriesModel,
    ]),
    ApplicationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: ICaseService,
      useClass: CaseService,
    },
  ],
  exports: [ICaseService],
})
export class CaseModule {}
