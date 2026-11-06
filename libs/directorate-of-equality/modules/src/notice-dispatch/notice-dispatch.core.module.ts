import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyReportModel } from '../company/models/company-report.model'
import { CompanyFileCoreModule } from '../company-file/company-file.core.module'
import { DoeMailModule } from '../mail/doe-mail.module'
import { MailboxDeliveryCoreModule } from '../mailbox-delivery/mailbox-delivery.core.module'
import { NoticeOutboxModel } from '../notice-outbox/models/notice-outbox.model'
import { PdfRenderCoreModule } from '../pdf-render/pdf-render.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportPdfCoreModule } from '../report-pdf/report-pdf.core.module'
import { NoticeDispatchService } from './notice-dispatch.service'
import { INoticeDispatchService } from './notice-dispatch.service.interface'

/**
 * Sends what the notice outbox holds. Renders PDFs (Chromium), sends mail and
 * talks to OneSystems, so only doe-api imports it. Every other app only writes to the outbox,
 * through `NoticeOutboxCoreModule`.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      NoticeOutboxModel,
      ReportModel,
      ReportEventModel,
      CompanyReportModel,
    ]),
    DoeMailModule,
    ReportPdfCoreModule,
    PdfRenderCoreModule,
    CompanyFileCoreModule,
    MailboxDeliveryCoreModule,
  ],
  providers: [
    {
      provide: INoticeDispatchService,
      useClass: NoticeDispatchService,
    },
  ],
  exports: [INoticeDispatchService],
})
export class NoticeDispatchCoreModule {}
