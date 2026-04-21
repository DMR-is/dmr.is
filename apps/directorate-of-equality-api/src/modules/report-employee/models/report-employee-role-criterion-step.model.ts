import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
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
  role?: ReportEmployeeRoleModel

  @BelongsTo(() => ReportSubCriterionStepModel, {
    foreignKey: 'reportSubCriterionStepId',
    as: 'subCriterionStep',
  })
  subCriterionStep?: ReportSubCriterionStepModel
}
