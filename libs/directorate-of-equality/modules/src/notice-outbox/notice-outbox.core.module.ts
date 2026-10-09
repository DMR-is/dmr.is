import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { NoticeOutboxModel } from './models/notice-outbox.model'
import { NoticeOutboxService } from './notice-outbox.service'
import { INoticeOutboxService } from './notice-outbox.service.interface'

/**
 * Writing to the outbox only. Safe for every app, the partner API included: it
 * needs nothing but the database. Sending lives in `notice-dispatch`, which
 * only doe-api imports.
 */
@Module({
  imports: [SequelizeModule.forFeature([NoticeOutboxModel])],
  providers: [
    {
      provide: INoticeOutboxService,
      useClass: NoticeOutboxService,
    },
  ],
  exports: [INoticeOutboxService],
})
export class NoticeOutboxCoreModule {}
