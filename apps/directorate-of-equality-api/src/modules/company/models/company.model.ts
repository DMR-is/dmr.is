import { Column, DataType } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { CompanyDto } from '../dto/company.dto'

type CompanyAttributes = {
  name: string
  averageEmployeeCountFromRsk: number
  nationalId: string
  salaryReportRequired: boolean
  salaryReportRequiredOverride: boolean
}

type CompanyCreateAttributes = {
  name: string
  averageEmployeeCountFromRsk: number
  nationalId: string
  salaryReportRequired?: boolean
  salaryReportRequiredOverride?: boolean
}

@MutableTable({ tableName: DoeModels.COMPANY })
export class CompanyModel extends MutableModel<
  CompanyAttributes,
  CompanyCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'average_employee_count_from_rsk',
  })
  averageEmployeeCountFromRsk!: number

  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'salary_report_required',
  })
  salaryReportRequired!: boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'salary_report_required_override',
  })
  salaryReportRequiredOverride!: boolean

  static fromModel(model: CompanyModel): CompanyDto {
    return {
      id: model.id,
      name: model.name,
      averageEmployeeCountFromRsk: model.averageEmployeeCountFromRsk,
      nationalId: model.nationalId,
      salaryReportRequired: model.salaryReportRequired,
      salaryReportRequiredOverride: model.salaryReportRequiredOverride,
    }
  }

  fromModel(): CompanyDto {
    return CompanyModel.fromModel(this)
  }
}
