import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportAttachmentModel } from './models/report-attachment.model'
import { ReportAttachmentService } from './report-attachment.service'
import { IReportAttachmentService } from './report-attachment.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([ReportAttachmentModel, ReportModel]),
    ImportUploadCoreModule,
  ],
  providers: [
    {
      provide: IReportAttachmentService,
      useClass: ReportAttachmentService,
    },
  ],
  exports: [IReportAttachmentService],
})
export class ReportAttachmentCoreModule {}
