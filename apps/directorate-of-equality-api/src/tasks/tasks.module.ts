import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvisoryLockModule } from '@dmr.is/shared-modules'

import { CompanyModel } from '../modules/company/models/company.model'
import { CompanyEventCoreModule } from '../modules/company-event/company-event.core.module'
import { DoeMailModule } from '../modules/mail/doe-mail.module'
import { ReportDraftCoreModule } from '../modules/report-draft/report-draft.core.module'
import { ReportDeadlineReminderService } from './report-deadline-reminder/report-deadline-reminder.service'
import { IReportDeadlineReminderService } from './report-deadline-reminder/report-deadline-reminder.service.interface'
import { ReportDeadlineReminderTask } from './report-deadline-reminder/report-deadline-reminder.task'
import { ReportDraftPruneTask } from './report-draft-prune/report-draft-prune.task'

@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel]),
    AdvisoryLockModule,
    CompanyEventCoreModule,
    DoeMailModule,
    ReportDraftCoreModule,
  ],
  providers: [
    ReportDeadlineReminderTask,
    {
      provide: IReportDeadlineReminderService,
      useClass: ReportDeadlineReminderService,
    },
    ReportDraftPruneTask,
  ],
})
export class TasksModule {}
