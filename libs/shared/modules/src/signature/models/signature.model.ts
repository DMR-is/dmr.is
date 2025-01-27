import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from '../../case/models'
import { AdvertInvolvedPartyModel, AdvertModel } from '../../journal/models'
import { AdvertSignaturesModel } from './advert-signatures.model'
import { CaseSignaturesModel } from './case-signatures.model'
import { SignatureMemberModel } from './signature-member.model'
import { SignatureMembersModel } from './signature-members.model'
import { SignatureTypeModel } from './signature-type.model'

@Table({ tableName: 'signature', timestamps: false })
export class SignatureModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
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
  })
  date!: string

  @Column({
    type: DataType.UUID,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @Column({ type: DataType.UUID, field: 'type_id' })
  typeId!: string

  @BelongsTo(() => SignatureTypeModel, 'type_id')
  type!: SignatureTypeModel

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'chairman_id',
  })
  chairmanId?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'additional_signature',
  })
  additionalSignature?: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  html?: string

  @BelongsTo(() => AdvertInvolvedPartyModel, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyModel

  @BelongsTo(() => SignatureMemberModel, {
    foreignKey: 'chairman_id',
    as: 'chairman',
  })
  chairman?: SignatureMemberModel

  @HasOne(() => CaseSignaturesModel, 'case_case_id')
  case?: CaseModel

  @HasOne(() => AdvertSignaturesModel, 'advert_id')
  advert?: AdvertModel

  @BelongsToMany(() => SignatureMemberModel, {
    as: 'members',
    through: { model: () => SignatureMembersModel },
  })
  members?: SignatureMemberModel[]
}
