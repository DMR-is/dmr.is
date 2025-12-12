import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty } from '@nestjs/swagger'

import { BaseModel } from '@dmr.is/shared/models/base'

import { DetailedDto } from '../core/dto/detailed.dto'

export type TBRCompanySettingsAttributes = {
  name: string
  nationalId: string
  email?: string
  phone?: string
  code: string
}

export type TBRCompanySettingsCreateAttributes = TBRCompanySettingsAttributes

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

  @Column({ type: DataType.STRING(50), allowNull: false })
  code!: string

  static fromModel(model: TBRCompanySettingsModel): TBRCompanySettingsItemDto {
    return {
      id: model.id,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
      name: model.name,
      nationalId: model.nationalId,
      email: model.email,
      phone: model.phone,
      code: model.code,
    }
  }

  fromModel(): TBRCompanySettingsItemDto {
    return TBRCompanySettingsModel.fromModel(this)
  }
}

export class TBRCompanySettingsItemDto extends DetailedDto {
  @ApiProperty({ type: String })
  name!: string

  @ApiProperty({ type: String })
  nationalId!: string

  @ApiProperty({ type: String, required: false })
  email?: string

  @ApiProperty({ type: String, required: false })
  phone?: string

  @ApiProperty({ type: String })
  code!: string
}

export class TBRCompanySettingsListDto {
  @ApiProperty({ type: [TBRCompanySettingsItemDto] })
  items!: TBRCompanySettingsItemDto[]
}
