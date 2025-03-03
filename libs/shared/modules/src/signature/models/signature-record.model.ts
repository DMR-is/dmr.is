import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { SignatureModel } from './signature.model'
import { SignatureMemberModel } from './signature-member.model'
@DefaultScope(() => ({
  order: [['date', 'ASC']],
}))
@Table({ tableName: 'signature_record', timestamps: false })
export class SignatureRecordModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  institution!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'date',
  })
  signatureDate!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'additional_signature',
  })
  additional!: string | null

  @ForeignKey(() => SignatureModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'signature_id',
  })
  signatureId!: string

  @ForeignKey(() => SignatureMemberModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'chairman_id',
  })
  chairmanId!: string | null

  @BelongsTo(() => SignatureModel, {
    foreignKey: 'signature_id',
    as: 'signature',
  })
  signature!: SignatureModel

  @BelongsTo(() => SignatureMemberModel, {
    foreignKey: 'chairman_id',
    as: 'chairman',
  })
  chairman!: SignatureMemberModel | null

  @HasMany(() => SignatureMemberModel)
  members!: SignatureMemberModel[]
}
