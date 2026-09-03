// Association annotations use a type-only alias — see `src/models.ts`.
import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { ReportSubCriterionStepModel as ReportSubCriterionStepModelRef } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import type { ReportEmployeeRoleModel as ReportEmployeeRoleModelRef } from './report-employee-role.model'
import { ReportEmployeeRoleModel } from './report-employee-role.model'

type ReportEmployeeRoleCriterionStepAttributes = {
  reportEmployeeRoleId: string
  reportSubCriterionStepId: string
}

type ReportEmployeeRoleCriterionStepCreateAttributes =
  ReportEmployeeRoleCriterionStepAttributes

@ImmutableTable({ tableName: DoeModels.REPORT_EMPLOYEE_ROLE_CRITERION_STEP })
export class ReportEmployeeRoleCriterionStepModel extends ImmutableModel<
  ReportEmployeeRoleCriterionStepAttributes,
  ReportEmployeeRoleCriterionStepCreateAttributes
> {
  @ForeignKey(() => ReportEmployeeRoleModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_role_id',
  })
  reportEmployeeRoleId!: string

  @ForeignKey(() => ReportSubCriterionStepModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_sub_criterion_step_id',
  })
  reportSubCriterionStepId!: string

  @BelongsTo(() => ReportEmployeeRoleModel, {
    foreignKey: 'reportEmployeeRoleId',
    as: 'role',
  })
  role?: ReportEmployeeRoleModelRef

  @BelongsTo(() => ReportSubCriterionStepModel, {
    foreignKey: 'reportSubCriterionStepId',
    as: 'subCriterionStep',
  })
  subCriterionStep?: ReportSubCriterionStepModelRef
}
