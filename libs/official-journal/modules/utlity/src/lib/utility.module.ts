import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UtilityService } from './utility.service'
import { IUtilityService } from './utility.service.interface'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
  AdvertStatusModel,
  AdvertTypeModel,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import { ApplicationModule } from '@dmr.is/official-journal/modules/application'

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
      AdvertInvolvedPartyModel,
      AdvertStatusModel,
    ]),
    forwardRef(() => ApplicationModule),
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
