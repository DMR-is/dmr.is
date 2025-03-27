import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'

import { SignatureRecordModel } from './signature-record.model'
import {
  AdvertInvolvedPartyModel,
  AdvertModel,
} from '@dmr.is/official-journal/modules/journal'
import { CaseModel } from '@dmr.is/official-journal/modules/case'

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

  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'involved_party_id',
  })
  involvedPartyId!: string

  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @ForeignKey(() => AdvertModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'advert_id',
  })
  advertId!: string | null

  @Column({
    type: DataType.DATE,
    field: 'created',
  })
  created!: Date

  @BelongsTo(() => AdvertInvolvedPartyModel)
  involvedParty!: AdvertInvolvedPartyModel

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => AdvertModel)
  advert!: AdvertModel | null

  @HasMany(() => SignatureRecordModel)
  records!: SignatureRecordModel[]
}
