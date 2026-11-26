import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ImportUploadCoreModule } from '../import-upload/import-upload.core.module'
import { ReportModel } from '../report/models/report.model'
import { EqualityPlanUploadService } from './equality-plan-upload.service'
import { IEqualityPlanUploadService } from './equality-plan-upload.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ReportModel]), ImportUploadCoreModule],
  providers: [
    {
      provide: IEqualityPlanUploadService,
      useClass: EqualityPlanUploadService,
    },
  ],
  exports: [IEqualityPlanUploadService],
})
export class EqualityPlanUploadCoreModule {}
