import { DynamicModule, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyCoreModule } from '../company/company.core.module'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ConfigCoreModule } from '../config/config.core.module'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportCoreModule } from '../report/report.core.module'
import { ReportCommentCoreModule } from '../report-comment/report-comment.core.module'
import { ReportCreateCoreModule } from '../report-create/report-create.core.module'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportEventCoreModule } from '../report-event/report-event.core.module'
import { ReportExcelCoreModule } from '../report-excel/report-excel.core.module'
import { ReportResultCoreModule } from '../report-result/report-result.core.module'
import { ApplicationService } from './application.service'
import { IApplicationService } from './application.service.interface'
import {
  REPORT_PROVIDER_CHANNEL,
  type ReportProviderChannel,
} from './provider-channel'

/**
 * Registered with the channel the consuming app speaks for.
 *
 * `forChannel` rather than a plain module because the same service backs two
 * apps on two channels — island.is over X-Road and the partner API over the
 * internet — and the channel decides both what `provider_type` a submission
 * gets and how its `provider_id` is namespaced. There is no sensible default:
 * an app that does not say which channel it is should not be able to submit.
 */
@Module({})
export class ApplicationCoreModule {
  static forChannel(channel: ReportProviderChannel): DynamicModule {
    return {
      module: ApplicationCoreModule,
      imports: [
        CompanyCoreModule,
        ReportExcelCoreModule,
        ConfigCoreModule,
        ReportCoreModule,
        ReportCreateCoreModule,
        ReportCommentCoreModule,
        ReportEventCoreModule,
        ReportResultCoreModule,
        SequelizeModule.forFeature([
          ReportModel,
          CompanyReportModel,
          ReportEmployeeOutlierModel,
          ReportOutlierGroupModel,
          ReportEventModel,
        ]),
      ],
      providers: [
        { provide: REPORT_PROVIDER_CHANNEL, useValue: channel },
        { provide: IApplicationService, useClass: ApplicationService },
      ],
      exports: [IApplicationService],
    }
  }
}
