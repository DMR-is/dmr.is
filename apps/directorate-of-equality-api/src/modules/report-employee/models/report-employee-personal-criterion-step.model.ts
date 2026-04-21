import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from './report-employee.model'

type ReportEmployeePersonalCriterionStepAttributes = {
  reportEmployeeId: string
  reportSubCriterionStepId: string
}

type ReportEmployeePersonalCriterionStepCreateAttributes =
  ReportEmployeePersonalCriterionStepAttributes

@ImmutableTable({
  tableName: DoeModels.REPORT_EMPLOYEE_PERSONAL_CRITERION_STEP,
})
export class ReportEmployeePersonalCriterionStepModel extends ImmutableModel<
  ReportEmployeePersonalCriterionStepAttributes,
  ReportEmployeePersonalCriterionStepCreateAttributes
> {
  @ForeignKey(() => ReportEmployeeModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_employee_id',
  })
  reportEmployeeId!: string

  @ForeignKey(() => ReportSubCriterionStepModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'report_sub_criterion_step_id',
  })
  reportSubCriterionStepId!: string

  @BelongsTo(() => ReportEmployeeModel, {
    foreignKey: 'reportEmployeeId',
    as: 'reportEmployee',
  })
  reportEmployee?: ReportEmployeeModel

  @BelongsTo(() => ReportSubCriterionStepModel, {
    foreignKey: 'reportSubCriterionStepId',
    as: 'subCriterionStep',
  })
  subCriterionStep?: ReportSubCriterionStepModel
}
