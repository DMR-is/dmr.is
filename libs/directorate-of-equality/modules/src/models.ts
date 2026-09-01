import { ApiKeyModel } from '@dmr.is/doe-shared'

import { CompanyModel } from './company/models/company.model'
import { CompanyCommentModel } from './company/models/company-comment.model'
import { CompanyEventModel } from './company/models/company-event.model'
import { CompanyReportModel } from './company/models/company-report.model'
import { IsatCategoryModel } from './company/models/isat-category.model'
import { IsatSectionModel } from './company/models/isat-section.model'
import { LegacyReportModel } from './company/models/legacy-report.model'
import { ConfigModel } from './config/models/config.model'
import { PostcodeModel } from './location/models/postcode.model'
import { RegionModel } from './location/models/region.model'
import { PublicReportModel } from './public-report/models/public-report.model'
import { ReportModel } from './report/models/report.model'
import { ReportEventModel } from './report/models/report-event.model'
import { ReportCommentModel } from './report-comment/models/report-comment.model'
import { ReportCriterionModel } from './report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from './report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from './report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from './report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from './report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from './report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from './report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from './report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from './report-employee/models/report-outlier-group.model'
import { ReportResultModel } from './report-result/models/report-result.model'
import { UserModel } from './user/models/user.model'

/**
 * Every model in the DoE schema, in the order Sequelize should register them.
 *
 * Exists because both APIs write to the same database and so both must register
 * the identical graph. Two hand-maintained lists would drift, and the failure
 * mode is nasty: a model missing in one service only, discovered at boot in that
 * service, or worse at the first query that needs the association.
 *
 * `ApiKeyModel` comes from `@dmr.is/doe-shared` and is included here anyway —
 * this is the registration list for the whole schema, not for one library.
 */
export const DOE_MODELS = [
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
  PublicReportModel,
  ReportEventModel,
  ReportCommentModel,
  CompanyEventModel,
  CompanyCommentModel,
  LegacyReportModel,
  ConfigModel,
  ApiKeyModel,
]
