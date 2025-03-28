import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UtilityService } from './utility.service'
import { IUtilityService } from './utility.service.interface'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertModel,
  AdvertStatusModel,
  AdvertTypeModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'

export { IUtilityService, UtilityService }
@Module({
  imports: [
    SequelizeModule.forFeature([
      AdvertModel,
      CaseModel,
      AdvertDepartmentModel,
      AdvertTypeModel,
      AdvertCategoryModel,
      CaseStatusModel,
      CaseTagModel,
      CaseCommunicationStatusModel,
      AdvertStatusModel,
    ]),
  ],
  providers: [
    {
      provide: IUtilityService,
      useClass: UtilityService,
    },
  ],
  exports: [IUtilityService],
})
export class UtilityModule {}
