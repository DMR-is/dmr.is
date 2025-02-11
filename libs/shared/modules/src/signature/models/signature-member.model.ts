import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { SignatureRecordModel } from './signature-record.model'

@Table({ tableName: 'signature_member', timestamps: false })
export class SignatureMemberModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @ForeignKey(() => SignatureRecordModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'signature_record_id',
  })
  signatureRecordId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'name',
  })
  name!: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_above',
  })
  textAbove!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_below',
  })
  textBelow!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_before',
  })
  textBefore!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'text_after',
  })
  textAfter!: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'created',
  })
  created!: string

  @BelongsTo(() => SignatureRecordModel, 'signature_record_id')
  record!: SignatureRecordModel
}
