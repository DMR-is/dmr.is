import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { PostcodeModel } from '../../location/models/postcode.model'
import type { CreateReportCompanySnapshotDto } from '../../report-create/dto/create-report.dto'
import type { CompanyDto } from '../dto/company.dto'
import { CompanySizeEnum, CompanyStatusEnum } from './company.enums'
import { IsatCategoryModel } from './isat-category.model'

type CompanyAttributes = {
  name: string
  employeeCountCategory: CompanySizeEnum
  nationalId: string
  status: CompanyStatusEnum
  address: string | null
  postcodeId: string | null
  salaryReportRequired: boolean
  salaryReportRequiredOverride: boolean
  isatCategoryCode: string | null
}

type CompanyCreateAttributes = {
  name: string
  employeeCountCategory: CompanySizeEnum
  nationalId: string
  status?: CompanyStatusEnum
  address?: string | null
  postcodeId?: string | null
  salaryReportRequired?: boolean
  salaryReportRequiredOverride?: boolean
  isatCategoryCode?: string | null
}

@MutableTable({ tableName: DoeModels.COMPANY })
export class CompanyModel extends MutableModel<
  CompanyAttributes,
  CompanyCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanySizeEnum)),
    allowNull: false,
    field: 'employee_count_category',
  })
  employeeCountCategory!: CompanySizeEnum

  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatusEnum)),
    allowNull: false,
    defaultValue: CompanyStatusEnum.ACTIVE,
  })
  status!: CompanyStatusEnum

  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null

  @ForeignKey(() => PostcodeModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'postcode_id' })
  postcodeId!: string | null

  @BelongsTo(() => PostcodeModel, { foreignKey: 'postcodeId', as: 'postcode' })
  postcode?: PostcodeModel | null

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

  @ForeignKey(() => IsatCategoryModel)
  @Column({ type: DataType.TEXT, allowNull: true, field: 'isat_category_code' })
  isatCategoryCode!: string | null

  @BelongsTo(() => IsatCategoryModel, {
    foreignKey: 'isatCategoryCode',
    targetKey: 'code',
    as: 'isatCategory',
  })
  isatCategory?: IsatCategoryModel | null

  static fromModel(model: CompanyModel): CompanyDto {
    return {
      id: model.id,
      name: model.name,
      employeeCountCategory: model.employeeCountCategory,
      nationalId: model.nationalId,
      status: model.status,
      address: model.address,
      postcodeId: model.postcodeId,
      salaryReportRequired: model.salaryReportRequired,
      salaryReportRequiredOverride: model.salaryReportRequiredOverride,
      isatCategoryCode: model.isatCategoryCode,
      isatCategory: model.isatCategory
        ? IsatCategoryModel.fromModel(model.isatCategory)
        : null,
    }
  }

  // NOTE: company-level ISAT (isatCategoryCode) is admin-owned statistics data
  // and is intentionally NOT snapshotted here — report_company.isat_category is
  // an independent free-text submission snapshot. See db/README.md.
  static toSnapshot(dto: CompanyDto): CreateReportCompanySnapshotDto {
    return {
      companyId: dto.id,
      parentCompanyId: null,
      name: dto.name,
      nationalId: dto.nationalId,
      address: '',
      city: '',
      postcode: '',
      isatCategory: '',
    }
  }

  fromModel(): CompanyDto {
    return CompanyModel.fromModel(this)
  }
}
