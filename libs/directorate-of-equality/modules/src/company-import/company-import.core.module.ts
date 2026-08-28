import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { IsatCategoryModel } from '../company/models/isat-category.model'
import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { PostcodeModel } from '../location/models/postcode.model'
import { CompanyImportService } from './company-import.service'
import { ICompanyImportService } from './company-import.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CompanyModel,
      IsatCategoryModel,
      PostcodeModel,
    ]),
    CompanyEventCoreModule,
  ],
  providers: [
    {
      provide: ICompanyImportService,
      useClass: CompanyImportService,
    },
  ],
  exports: [ICompanyImportService],
})
export class CompanyImportCoreModule {}
