import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvisoryLockModule } from '@dmr.is/shared-modules'

import { CompanyModel } from '../modules/company/models/company.model'
import { CompanyEventCoreModule } from '../modules/company-event/company-event.core.module'
import { DoeMailModule } from '../modules/mail/doe-mail.module'
import { ReportModel } from '../modules/report/models/report.model'
import { ReportDeadlineReminderService } from './report-deadline-reminder/report-deadline-reminder.service'
import { IReportDeadlineReminderService } from './report-deadline-reminder/report-deadline-reminder.service.interface'
import { ReportDeadlineReminderTask } from './report-deadline-reminder/report-deadline-reminder.task'

@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel, ReportModel]),
    AdvisoryLockModule,
    CompanyEventCoreModule,
    DoeMailModule,
  ],
  providers: [
    ReportDeadlineReminderTask,
    {
      provide: IReportDeadlineReminderService,
      useClass: ReportDeadlineReminderService,
    },
  ],
})
export class TasksModule {}
