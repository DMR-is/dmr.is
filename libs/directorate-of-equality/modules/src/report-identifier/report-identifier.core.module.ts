import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { ReportIdentifierService } from './report-identifier.service'
import { IReportIdentifierService } from './report-identifier.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ReportModel])],
  providers: [
    {
      provide: IReportIdentifierService,
      useClass: ReportIdentifierService,
    },
  ],
  exports: [IReportIdentifierService],
})
export class ReportIdentifierCoreModule {}
