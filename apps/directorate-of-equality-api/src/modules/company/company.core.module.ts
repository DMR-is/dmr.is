import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NationalRegistryModule } from '@dmr.is/clients-national-registry'

import { CompanyCommentCoreModule } from '../company-comment/company-comment.core.module'
import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { CompanyModel } from './models/company.model'
import { CompanyService } from './company.service'
import { ICompanyService } from './company.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel]),
    NationalRegistryModule,
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
