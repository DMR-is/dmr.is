import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiBoolean, ApiOptionalString, ApiString } from '@dmr.is/decorators'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { DetailedDto } from '../modules/shared/dto/detailed.dto'

export type TBRCompanySettingsAttributes = {
  name: string
  nationalId: string
  email?: string
  phone?: string
  active: boolean
  code: string
}

export type TBRCompanySettingsCreateAttributes = TBRCompanySettingsAttributes

@DefaultScope(() => ({
  order: [['name', 'ASC']],
}))
@BaseTable({ tableName: LegalGazetteModels.TBR_COMPANY_SETTINGS })
export class TBRCompanySettingsModel extends BaseModel<
  TBRCompanySettingsAttributes,
  TBRCompanySettingsCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({ type: DataType.STRING(10), allowNull: false })
  nationalId!: string

  @Column({ type: DataType.STRING(255), allowNull: true })
  email?: string

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone?: string

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean

  @Column({ type: DataType.STRING(50), allowNull: false })
  code!: string

  get phoneNumber() {
    if (!this.phone) return

    if (this.phone.startsWith('+354')) {
      return this.phone.replace('+354', '+354 ')
    }

    if (this.phone.startsWith('354')) {
      return this.phone.replace('354', '+354 ')
    }

    return this.phone
  }

  static fromModel(model: TBRCompanySettingsModel): TBRCompanySettingsItemDto {
    return {
      id: model.id,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      name: model.name,
      nationalId: model.nationalId,
      email: model.email,
      phone: model.phoneNumber,
      active: model.active,
      code: model.code,
    }
  }

  fromModel(): TBRCompanySettingsItemDto {
    return TBRCompanySettingsModel.fromModel(this)
  }
}

export class TBRCompanySettingsItemDto extends DetailedDto {
  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string

  @ApiOptionalString()
  email?: string

  @ApiOptionalString()
  phone?: string

  @ApiString()
  code!: string

  @ApiBoolean()
  active!: boolean
}
