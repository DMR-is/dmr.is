import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
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

import { DeclaredAccessGuard } from '../core/guards/declared-access/declared-access.guard'
import { CompanyModel } from '../modules/company/models/company.model'
import { CompanyCommentModel } from '../modules/company/models/company-comment.model'
import { CompanyEventModel } from '../modules/company/models/company-event.model'
import { CompanyReportModel } from '../modules/company/models/company-report.model'
import { IsatCategoryModel } from '../modules/company/models/isat-category.model'
import { IsatSectionModel } from '../modules/company/models/isat-section.model'
import { ConfigModel } from '../modules/config/models/config.model'
import { PostcodeModel } from '../modules/location/models/postcode.model'
import { RegionModel } from '../modules/location/models/region.model'
import { PublicReportModel } from '../modules/public-report/models/public-report.model'
import { ReportModel } from '../modules/report/models/report.model'
import { ReportEventModel } from '../modules/report/models/report-event.model'
import { ReportCommentModel } from '../modules/report-comment/models/report-comment.model'
import { ReportCriterionModel } from '../modules/report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../modules/report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../modules/report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../modules/report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../modules/report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../modules/report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../modules/report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../modules/report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../modules/report-employee/models/report-outlier-group.model'
import { ReportResultModel } from '../modules/report-result/models/report-result.model'
import { ReportRoleResultModel } from '../modules/report-result/models/report-role-result.model'
import { DoeApplicationSwaggerModule } from '../modules/swagger/doe-application.swagger.module'
import { DoeWebSwaggerModule } from '../modules/swagger/doe-web.swagger.module'
import { UserModel } from '../modules/user/models/user.model'
import { TasksModule } from '../tasks/tasks.module'
import { HealthController } from './health.controller'
@Module({
  imports: [
    LoggingModule,
    ScheduleModule.forRoot(),
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
            RegionModel,
            PostcodeModel,
            IsatSectionModel,
            IsatCategoryModel,
            CompanyModel,
            ReportEmployeeRoleModel,
            ReportModel,
            CompanyReportModel,
            ReportCriterionModel,
            ReportSubCriterionModel,
            ReportSubCriterionStepModel,
            ReportEmployeeModel,
            ReportEmployeeOutlierModel,
            ReportOutlierGroupModel,
            ReportEmployeeRoleCriterionStepModel,
            ReportEmployeePersonalCriterionStepModel,
            ReportResultModel,
            ReportRoleResultModel,
            PublicReportModel,
            ReportEventModel,
            ReportCommentModel,
            CompanyEventModel,
            CompanyCommentModel,
            ConfigModel,
          ],
        }),
      ],
      useFactory: (configService: DMRSequelizeConfigService) =>
        configService.createSequelizeOptions(),
      inject: [DMRSequelizeConfigService],
    }),
    // The two swagger aggregates are also the runtime registration points, so
    // a controller can never be routed without appearing in a published
    // document (enforced by swagger-coverage.spec.ts).
    DoeApplicationSwaggerModule,
    DoeWebSwaggerModule,
    TasksModule,
  ],
  controllers: [HealthController],
  providers: [
    // Default-deny for every route in the API. Runs before any controller or
    // route guard, and refuses anything whose @UseGuards chain does not state
    // who may call it. Authorization is opt-out, not opt-in: a new controller
    // is unreachable until its author declares an audience.
    {
      provide: APP_GUARD,
      useClass: DeclaredAccessGuard,
    },
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
