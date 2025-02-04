import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { SignatureMemberModel } from './signature-member.model'

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

  @HasMany(() => SignatureMemberModel, 'signature_record_id')
  members!: SignatureMemberModel[]
}
