import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/shared-modules'

import { CompanyModel } from '../company/models/company.model'
import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { NoticePdfService } from './notice-pdf.service'
import { INoticePdfService } from './notice-pdf.service.interface'
import { NoticeStoreService } from './notice-store.service'
import { INoticeStoreService } from './notice-store.service.interface'
import { PostholfService } from './postholf.service'
import { IPostholfService } from './postholf.service.interface'
import { PostholfDocumentService } from './postholf-document.service'
import { IPostholfDocumentService } from './postholf-document.service.interface'

/**
 * Everything needed to talk to the island.is mailbox, in both directions.
 *
 * Plain `@Module` with symbol providers, matching
 * `application-system.core.module.ts` — no `forRoot`, per the repo's
 * `no-async-module-init` rule and because there is no per-import configuration.
 */
@Module({
  imports: [
    SequelizeModule.forFeature([CompanyModel]),
    CompanyEventCoreModule,
    AwsModule,
  ],
  providers: [
    { provide: IPostholfService, useClass: PostholfService },
    { provide: INoticePdfService, useClass: NoticePdfService },
    { provide: INoticeStoreService, useClass: NoticeStoreService },
    { provide: IPostholfDocumentService, useClass: PostholfDocumentService },
  ],
  exports: [
    IPostholfService,
    INoticePdfService,
    INoticeStoreService,
    IPostholfDocumentService,
  ],
})
export class PostholfCoreModule {}
