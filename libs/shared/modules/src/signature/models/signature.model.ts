import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from '../../case/models'
import { AdvertInvolvedPartyModel, AdvertModel } from '../../journal/models'
import { AdvertSignaturesModel } from './advert-signatures.model'
import { CaseSignaturesModel } from './case-signatures.model'
import { SignatureRecordModel } from './signature-record.model'

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
    field: 'date',
  })
  signatureDate!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  html!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'advert_id',
  })
  advertId!: string | null

  @BelongsTo(() => AdvertInvolvedPartyModel, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyModel

  @BelongsTo(() => CaseSignaturesModel, 'case_id')
  case!: CaseModel

  @BelongsTo(() => AdvertSignaturesModel, 'advert_id')
  advert!: AdvertModel | null

  @HasMany(() => SignatureRecordModel, 'signature_id')
  records!: SignatureRecordModel[]
}
