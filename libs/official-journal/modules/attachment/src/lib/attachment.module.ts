import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AttachmentService } from './attachment.service'
import { IAttachmentService } from './attachment.service.interface'
import { ApplicationAttachmentModel } from './models/application-attachment.model'
import { ApplicationAttachmentsModel } from './models/application-attachments.model'
import { ApplicationAttachmentTypeModel } from './models/application-attachment-type.model'
import { CaseAttachmentsModel } from './models/case-attachments.model'

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
