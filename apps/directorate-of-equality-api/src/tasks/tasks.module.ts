import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '@dmr.is/doe-modules/company'
import { CompanyEventCoreModule } from '@dmr.is/doe-modules/company-event'
import { DoeMailModule } from '@dmr.is/doe-modules/mail'
import { MailboxDeliveryCoreModule } from '@dmr.is/doe-modules/mailbox-delivery'
import { NoticeDispatchCoreModule } from '@dmr.is/doe-modules/notice-dispatch'
import { PdfRenderCoreModule } from '@dmr.is/doe-modules/pdf-render'
import { ReportDraftCoreModule } from '@dmr.is/doe-modules/report-draft'
import { AdvisoryLockModule } from '@dmr.is/shared-modules'

import { NoticeOutboxTask } from './notice-outbox/notice-outbox.task'
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
    NoticeDispatchCoreModule,
    MailboxDeliveryCoreModule,
    PdfRenderCoreModule,
    ReportDraftCoreModule,
  ],
  providers: [
    ReportDeadlineReminderTask,
    {
      provide: IReportDeadlineReminderService,
      useClass: ReportDeadlineReminderService,
    },
    ReportDraftPruneTask,
    NoticeOutboxTask,
  ],
})
export class TasksModule {}
