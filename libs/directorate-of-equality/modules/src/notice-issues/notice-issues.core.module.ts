import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { MailboxDeliveryCoreModule } from '../mailbox-delivery/mailbox-delivery.core.module'
import { MailboxDeliveryModel } from '../mailbox-delivery/models/mailbox-delivery.model'
import { NoticeDispatchCoreModule } from '../notice-dispatch/notice-dispatch.core.module'
import { NoticeOutboxModel } from '../notice-outbox/models/notice-outbox.model'
import { ReportModel } from '../report/models/report.model'
import { NoticeIssuesService } from './notice-issues.service'
import { INoticeIssuesService } from './notice-issues.service.interface'

/** The admin view of undelivered notices. doe-api only, like the dispatcher. */
@Module({
  imports: [
    SequelizeModule.forFeature([
      NoticeOutboxModel,
      MailboxDeliveryModel,
      ReportModel,
      CompanyReportModel,
      CompanyModel,
    ]),
    NoticeDispatchCoreModule,
    MailboxDeliveryCoreModule,
  ],
  providers: [{ provide: INoticeIssuesService, useClass: NoticeIssuesService }],
  exports: [INoticeIssuesService],
})
export class NoticeIssuesCoreModule {}
