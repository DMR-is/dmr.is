import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseDto } from '../../case/models'
import { AdvertDTO, AdvertInvolvedPartyDTO } from '../../journal/models'
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

  @Column({
    type: DataType.UUID,
    field: 'type_id',
  })
  typeId!: string

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

  @BelongsTo(() => AdvertInvolvedPartyDTO, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyDTO

  @BelongsTo(() => SignatureTypeModel, 'type_id')
  type!: SignatureTypeModel

  @BelongsTo(() => SignatureMemberModel, 'chairman_id')
  chairman?: SignatureMemberModel

  @BelongsTo(() => CaseSignaturesModel, 'case_case_id')
  case?: CaseDto

  @BelongsTo(() => AdvertSignaturesModel, 'advert_id')
  advert?: AdvertDTO

  @BelongsToMany(() => SignatureMemberModel, {
    through: { model: () => SignatureMembersModel },
  })
  members!: SignatureMemberModel[]
}
