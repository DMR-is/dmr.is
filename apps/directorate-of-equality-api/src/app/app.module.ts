import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SequelizeModule } from '@nestjs/sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { DMRSequelizeConfigModule, DMRSequelizeConfigService } from '@dmr.is/db'
import { LoggingModule } from '@dmr.is/logging'
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  SequelizeExceptionFilter,
} from '@dmr.is/shared-filters'
import { CLSMiddleware, LogRequestMiddleware } from '@dmr.is/shared-middleware'

import { CompanyModel } from '../modules/company/models/company.model'
import { CompanyReportModel } from '../modules/company/models/company-report.model'
import { ConfigModule } from '../modules/config/config.module'
import { ConfigModel } from '../modules/config/models/config.model'
import { PublicReportModel } from '../modules/public-report/models/public-report.model'
import { ReportModel } from '../modules/report/models/report.model'
import { ReportCommentModel } from '../modules/report/models/report-comment.model'
import { ReportEventModel } from '../modules/report/models/report-event.model'
import { ReportModule } from '../modules/report/report.module'
import { ReportCreateModule } from '../modules/report-create/report-create.module'
import { ReportCriterionModel } from '../modules/report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../modules/report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../modules/report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../modules/report-employee/models/report-employee.model'
import { ReportEmployeeDeviationModel } from '../modules/report-employee/models/report-employee-deviation.model'
import { ReportEmployeePersonalCriterionStepModel } from '../modules/report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../modules/report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../modules/report-employee/models/report-employee-role-criterion-step.model'
import { ReportExcelModule } from '../modules/report-excel/report-excel.module'
import { ReportResultModel } from '../modules/report-result/models/report-result.model'
import { ReportRoleResultModel } from '../modules/report-result/models/report-role-result.model'
import { ReportResultModule } from '../modules/report-result/report-result.module'
import { ReportStatisticsModule } from '../modules/report-statistics/report-statistics.module'
import { UserModel } from '../modules/user/models/user.model'
import { UserModule } from '../modules/user/user.module'
@Module({
  imports: [
    LoggingModule,
    SequelizeModule.forRootAsync({
      imports: [
        DMRSequelizeConfigModule.register({
          database: process.env.DB_NAME || 'dev_db_directorate_of_equality',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASS || 'dev_db',
          username: process.env.DB_USER || 'dev_db',
          port:
            Number(process.env.DB_PORT) ||
            Number(process.env.DIRECTORATE_OF_EQUALITY_DB_PORT) ||
            5435,
          clsNamespace: CLS_NAMESPACE,
          debugLog: process.env.DB_DEBUG === 'true',
          autoLoadModels: false,
          models: [
            UserModel,
            CompanyModel,
            ReportEmployeeRoleModel,
            ReportModel,
            CompanyReportModel,
            ReportCriterionModel,
            ReportSubCriterionModel,
            ReportSubCriterionStepModel,
            ReportEmployeeModel,
            ReportEmployeeDeviationModel,
            ReportEmployeeRoleCriterionStepModel,
            ReportEmployeePersonalCriterionStepModel,
            ReportResultModel,
            ReportRoleResultModel,
            PublicReportModel,
            ReportEventModel,
            ReportCommentModel,
            ConfigModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    UserModule,
    ConfigModule,
    ReportExcelModule,
    ReportResultModule,
    ReportStatisticsModule,
    ReportModule,
    ReportCreateModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: SequelizeExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(CLSMiddleware).forRoutes('*')
    consumer.apply(LogRequestMiddleware).forRoutes('*')
  }
}
