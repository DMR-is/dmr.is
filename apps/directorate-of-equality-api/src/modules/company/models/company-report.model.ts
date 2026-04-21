import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { ReportModel } from '../../report/models/report.model'
import type { CompanyReportDto } from '../dto/company-report.dto'
import { CompanyModel } from './company.model'

type CompanyReportAttributes = {
  companyId: string
  reportId: string
  parentCompanyId: string | null

  name: string
  nationalId: string
  address: string
  city: string
  postcode: string
  averageEmployeeCountFromRsk: number
  isatCategory: string
}

type CompanyReportCreateAttributes = {
  companyId: string
  reportId: string
  parentCompanyId?: string | null

  name: string
  nationalId: string
  address: string
  city: string
  postcode: string
  averageEmployeeCountFromRsk: number
  isatCategory: string
}

@ImmutableTable({ tableName: DoeModels.COMPANY_REPORT })
export class CompanyReportModel extends ImmutableModel<
  CompanyReportAttributes,
  CompanyReportCreateAttributes
> {
  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'company_id' })
  companyId!: string

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  @ForeignKey(() => CompanyModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'parent_company_id' })
  parentCompanyId!: string | null

  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  address!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  city!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  postcode!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'average_employee_count_from_rsk',
  })
  averageEmployeeCountFromRsk!: number

  @Column({ type: DataType.TEXT, allowNull: false, field: 'isat_category' })
  isatCategory!: string

  @BelongsTo(() => CompanyModel, { foreignKey: 'companyId', as: 'company' })
  company?: CompanyModel

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModel

  @BelongsTo(() => CompanyModel, {
    foreignKey: 'parentCompanyId',
    as: 'parentCompany',
  })
  parentCompany?: CompanyModel | null

  static fromModel(model: CompanyReportModel): CompanyReportDto {
    return {
      id: model.id,
      companyId: model.companyId,
      reportId: model.reportId,
      parentCompanyId: model.parentCompanyId,
      name: model.name,
      nationalId: model.nationalId,
      address: model.address,
      city: model.city,
      postcode: model.postcode,
      averageEmployeeCountFromRsk: model.averageEmployeeCountFromRsk,
      isatCategory: model.isatCategory,
    }
  }

  fromModel(): CompanyReportDto {
    return CompanyReportModel.fromModel(this)
  }
}
