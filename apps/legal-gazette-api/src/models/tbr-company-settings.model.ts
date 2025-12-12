import { IsBoolean, IsOptional, IsString } from 'class-validator'
import { Column, DataType } from 'sequelize-typescript'

import { ApiProperty, PartialType, PickType } from '@nestjs/swagger'

import { Paging, PagingQuery } from '@dmr.is/shared/dto'
import { BaseModel } from '@dmr.is/shared/models/base'

import { DetailedDto } from '../core/dto/detailed.dto'

export type TBRCompanySettingsAttributes = {
  name: string
  nationalId: string
  email?: string
  phone?: string
  active: boolean
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

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean

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
      active: model.active,
      code: model.code,
    }
  }

  fromModel(): TBRCompanySettingsItemDto {
    return TBRCompanySettingsModel.fromModel(this)
  }
}

export class TBRCompanySettingsItemDto extends DetailedDto {
  @ApiProperty({ type: String })
  @IsString()
  name!: string

  @ApiProperty({ type: String })
  @IsString()
  nationalId!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  email?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ type: String })
  @IsString()
  code!: string

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active!: boolean
}

export class GetTBRCompanySettingsQueryDto extends PagingQuery {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ type: Boolean, required: false })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean
}
export class TBRCompanySettingsListDto {
  @ApiProperty({ type: [TBRCompanySettingsItemDto] })
  items!: TBRCompanySettingsItemDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateTBRCompanySettingsDto extends PickType(
  TBRCompanySettingsItemDto,
  ['name', 'nationalId', 'email', 'phone'],
) {}

export class UpdateTbrCompanySettingsDto extends PartialType(
  CreateTBRCompanySettingsDto,
) {}
