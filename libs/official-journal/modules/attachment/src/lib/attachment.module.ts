import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AttachmentService } from './attachment.service'
import { IAttachmentService } from './attachment.service.interface'

import {
  ApplicationAttachmentModel,
  ApplicationAttachmentsModel,
  ApplicationAttachmentTypeModel,
  CaseAttachmentsModel,
} from '@dmr.is/official-journal/models'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ApplicationAttachmentModel,
      ApplicationAttachmentsModel,
      ApplicationAttachmentTypeModel,
      CaseAttachmentsModel,
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: IAttachmentService,
      useClass: AttachmentService,
    },
  ],
  exports: [IAttachmentService],
})
export class AttachmentModule {}
