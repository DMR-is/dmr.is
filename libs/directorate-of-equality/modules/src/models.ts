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
 * Association properties across these models annotate their type through a
 * type-only alias rather than naming the class directly:
 *
 * ```ts
 * import { ReportModel } from '../../report/models/report.model'
 * import type { ReportModel as ReportModelRef } from '../../report/models/report.model'
 *
 * @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
 * report?: ReportModelRef
 * ```
 *
 * The model graph is inherently cyclic: `report.model.ts` imports
 * `ReportCommentModel` for its `@HasMany`, and `report-comment.model.ts`
 * imports `ReportModel` back for its `@BelongsTo`. The `() => Model` arrows are
 * lazy and fine. What is not fine is `emitDecoratorMetadata`, which emits an
 * EAGER read of the annotated type at class-decoration time — while the other
 * module is still mid-evaluation.
 *
 * tsc assigns `exports.X` only after the class body runs, so that read yields
 * `undefined` and the emitted guard quietly falls back to `Object`. swc emits
 * ESM-faithful live bindings — an export getter installed before any
 * `require()`, over a TDZ binding — so the same read THROWS
 * `Cannot access 'ReportModel' before initialization`. Under real ESM tsc's
 * would too. The cycle plus an eval-time read is the actual defect; swc only
 * makes it audible. (It surfaced when `doe-modules` tests moved to `@swc/jest`:
 * 36 of 65 suites failed on exactly this.)
 *
 * The alias resolves to a type-only binding, so neither compiler emits a
 * runtime read: swc emits `design:type = Object`, tsc `design:type = Function`
 * (in place of the class it used to reference). Nothing reads that metadata —
 * association decorators take their target from the arrow, and every `@Column`
 * in these models declares `type: DataType.*` explicitly, so none rely on
 * `design:type` inference. Verified by booting the Sequelize registry from
 * both emits: identical tables, associations and attributes across all 26
 * models.
 *
 * Safe without the alias, for reference: `X | null`, `X[]`, and same-file
 * self-references all already emit `Object`. Only a plain, cross-module class
 * annotation reads. For the same reason, model files import enums straight from
 * `report.enums.ts` rather than through the `report.model.ts` re-export.
 */

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
