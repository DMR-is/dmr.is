import {
  CaseCategoriesModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { ICaseService } from './case.service.interface'
import { CaseService } from './case.service'
import { CaseController } from './case.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      CaseStatusModel,
      CaseCommunicationStatusModel,
      CaseTagModel,
      CaseCategoriesModel,
    ]),
  ],
  controllers: [CaseController],
  providers: [
    {
      provide: ICaseService,
      useClass: CaseService,
    },
  ],
  exports: [ICaseService],
})
export class CaseModule {}
