import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator'
import { Column, DataType, DefaultScope } from 'sequelize-typescript'

import { ApiProperty, PickType } from '@nestjs/swagger'

import { Paging } from '@dmr.is/shared-dto'
import { BaseModel, BaseTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
export type UserAttributes = {
  id: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type UserCreateAttributes = {
  id?: string
  nationalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

@BaseTable({ tableName: LegalGazetteModels.USERS })
@DefaultScope(() => ({
  paranoid: false,
  orderBy: [
    ['firstName', 'ASC'],
    ['lastName', 'ASC'],
  ],
}))
export class UserModel extends BaseModel<UserAttributes, UserCreateAttributes> {
  @Column({
    type: DataType.TEXT,
    field: 'national_id',
    allowNull: false,
    unique: true,
  })
  @ApiProperty({ type: String })
  nationalId!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  firstName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @ApiProperty({ type: String })
  lastName!: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    unique: true,
  })
  @ApiProperty({ type: String })
  email!: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  @ApiProperty({ type: String, required: false })
  phone?: string | null

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  static fromModel(model: UserModel): UserDto {
    return {
      id: model.id,
      nationalId: model.nationalId,
      name: `${model.firstName} ${model.lastName}`,
      email: model.email,
      phone: model?.phone ?? undefined,
      isActive: !model.deletedAt,
    }
  }

  fromModel() {
    return UserModel.fromModel(this)
  }
}

export class UserDto extends PickType(UserModel, [
  'id',
  'nationalId',
  'email',
  'phone',
] as const) {
  @ApiProperty({
    type: String,
  })
  @IsString()
  name!: string

  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  phone?: string

  @ApiProperty({
    type: Boolean,
  })
  @IsBoolean()
  isActive!: boolean
}

export class GetUsersResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]
}

export class GetUsersWithPagingResponse {
  @ApiProperty({
    type: [UserDto],
  })
  users!: UserDto[]

  @ApiProperty({ type: Paging })
  paging!: Paging
}

export class CreateUserDto {
  @ApiProperty({ type: String })
  @IsString()
  nationalId!: string

  @ApiProperty({ type: String })
  @IsEmail()
  email!: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  phone?: string
}

export class UpdateUserDto {
  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsString()
  phone?: string
}
