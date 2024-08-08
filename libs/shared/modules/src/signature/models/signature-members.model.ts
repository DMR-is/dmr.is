import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { SignatureModel } from './signature.model'
import { SignatureMemberModel } from './signature-member.model'

@Table({ tableName: 'signature_members', timestamps: false })
export class SignatureMembersModel extends Model {
  @PrimaryKey
  @ForeignKey(() => SignatureModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_id',
  })
  signatureId!: string

  @PrimaryKey
  @ForeignKey(() => SignatureMemberModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_member_id',
  })
  signatureMemberId!: string

  @BelongsTo(() => SignatureModel, 'signature_id')
  signature!: SignatureModel

  @BelongsTo(() => SignatureMemberModel, 'signature_member_id')
  signatureMember!: SignatureMemberModel
}
