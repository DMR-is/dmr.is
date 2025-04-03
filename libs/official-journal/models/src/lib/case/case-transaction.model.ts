import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from './case.model'
import { OfficialJournalModels } from '../constants'

@Table({ tableName: OfficialJournalModels.CASE_TRANSACTION, timestamps: false })
export class CaseTransactionModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'external_reference',
  })
  externalReference!: string

  @Column({
    type: DataType.INTEGER,
    field: 'total_price',
    allowNull: true,
  })
  price!: number | null

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    field: 'fee_codes',
  })
  feeCodes!: string[] | null

  @Column({
    type: DataType.INTEGER,
    field: 'custom_unit_base_count',
    allowNull: true,
  })
  customBaseCount!: number | null

  @Column({
    type: DataType.INTEGER,
    field: 'custom_unit_additional_character_count',
    allowNull: true,
  })
  customAdditionalCharacterCount!: number | null

  @Column({
    type: DataType.INTEGER,
    field: 'custom_unit_additional_doc_count',
    allowNull: true,
  })
  customAdditionalDocCount!: number | null

  @Column({
    type: DataType.INTEGER,
    field: 'extra_work_count',
    allowNull: true,
  })
  extraWorkCount!: number | null

  @Column({
    type: DataType.STRING,
    field: 'subject',
    allowNull: true,
  })
  subject!: string | null

  @Column({
    type: DataType.STRING,
    field: 'image_tier_code',
    allowNull: true,
  })
  imageTier!: string | null
}
