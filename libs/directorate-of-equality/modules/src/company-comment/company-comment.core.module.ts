import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyCommentModel } from '../company/models/company-comment.model'
import { CompanyCommentService } from './company-comment.service'
import { ICompanyCommentService } from './company-comment.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CompanyCommentModel, CompanyModel])],
  providers: [
    {
      provide: ICompanyCommentService,
      useClass: CompanyCommentService,
    },
  ],
  exports: [ICompanyCommentService],
})
export class CompanyCommentCoreModule {}
