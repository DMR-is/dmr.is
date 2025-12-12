import { Column, DataType } from 'sequelize-typescript'

import { BaseModel } from '@dmr.is/shared/models/base'

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
}
