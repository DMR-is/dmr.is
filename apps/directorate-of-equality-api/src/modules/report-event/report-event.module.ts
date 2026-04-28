import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportEventModel } from '../report/models/report-event.model'
import { ReportEventService } from './report-event.service'
import { IReportEventService } from './report-event.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ReportEventModel])],
  providers: [
    {
      provide: IReportEventService,
      useClass: ReportEventService,
    },
  ],
  exports: [IReportEventService],
})
export class ReportEventModule {}
