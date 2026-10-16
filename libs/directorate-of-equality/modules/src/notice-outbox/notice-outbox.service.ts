import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { NoticeOutboxKindEnum } from './models/notice-outbox.enums'
import { NoticeOutboxModel } from './models/notice-outbox.model'
import { INoticeOutboxService } from './notice-outbox.service.interface'

@Injectable()
export class NoticeOutboxService implements INoticeOutboxService {
  constructor(
    @InjectModel(NoticeOutboxModel)
    private readonly noticeOutboxModel: typeof NoticeOutboxModel,
  ) {}

  async enqueue(kind: NoticeOutboxKindEnum, reportId: string): Promise<void> {
    await this.noticeOutboxModel.create({ kind, reportId })
  }
}
