import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportResourceGuard } from '../../core/guards/report-resource/report-resource.guard'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModule } from '../report-event/report-event.module'
import { UserModel } from '../user/models/user.model'
import { ReportWorkflowController } from './report-workflow.controller'
import { ReportWorkflowService } from './report-workflow.service'
import { IReportWorkflowService } from './report-workflow.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportModel, CompanyReportModel, UserModel]),
    ReportEventModule,
  ],
  controllers: [ReportWorkflowController],
  providers: [
    AdminGuard,
    ReportResourceGuard,
    {
      provide: IReportWorkflowService,
      useClass: ReportWorkflowService,
    },
  ],
  exports: [IReportWorkflowService],
})
export class ReportWorkflowModule {}
