import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AttachmentService } from './attachment.service'
import { IAttachmentService } from './attachment.service.interface'
import { models as attachmentModels } from './models'

@Module({
  imports: [SequelizeModule.forFeature([...attachmentModels]), LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IAttachmentService,
      useClass: AttachmentService,
    },
  ],
  exports: [IAttachmentService],
})
export class AttachmentsModule {}
