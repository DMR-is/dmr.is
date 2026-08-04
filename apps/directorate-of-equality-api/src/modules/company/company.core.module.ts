import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients-national-registry'
import { RskCompanyRegistryModule } from '@dmr.is/clients-rsk-client'

import { CompanyCommentCoreModule } from '../company-comment/company-comment.core.module'
import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { PostcodeModel } from '../location/models/postcode.model'
import { CompanyModel } from './models/company.model'
import { IsatCategoryModel } from './models/isat-category.model'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel, IsatCategoryModel, PostcodeModel]),
    NationalRegistryModule,
    RskCompanyRegistryModule,
    CompanyEventCoreModule,
    CompanyCommentCoreModule,
  ],
  providers: [
    {
      provide: ICompanyService,
      useClass: CompanyService,
    },
  ],
  exports: [ICompanyService],
})
export class CompanyCoreModule {}
