import { Column, DataType, Model, Table } from 'sequelize-typescript'

import type { HTMLText, PlainText } from '../routes/types'

type RegulationChangeSuggestionStatus =
  | 'pending'
  | 'applied'
  | 'rejected'
  | 'superseded'

type RegulationChangeSuggestionAttributes = {
  id: number
  regulationId: number
  changingId: number
  title: PlainText
  text: HTMLText
  changeset: string | null
  status: RegulationChangeSuggestionStatus
  appliedChangeId: number | null
  createdAt: Date
  decidedBy: string | null
  decidedAt: Date | null
}

@Table({ tableName: 'regulationchangesuggestion', timestamps: false })
export class DB_RegulationChangeSuggestion
  extends Model<
    RegulationChangeSuggestionAttributes,
    Omit<RegulationChangeSuggestionAttributes, 'id' | 'createdAt'>
  >
  implements RegulationChangeSuggestionAttributes
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER,
  })
  id!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Target/base regulation being changed',
    field: 'regulationId',
  })
  regulationId!: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'The regulation requesting the change (amending regulation)',
    field: 'changingId',
  })
  changingId!: number

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Suggested title after applying the change',
  })
  title!: PlainText

  @Column({
    type: DataType.TEXT('long'),
    allowNull: false,
    comment: 'Suggested full text after applying the change',
  })
  text!: HTMLText

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
    comment: 'Diff from current version to suggested version',
  })
  changeset!: string | null

  @Column({
    type: DataType.ENUM('pending', 'applied', 'rejected', 'superseded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Suggestion status',
  })
  status!: RegulationChangeSuggestionStatus

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'RegulationChange.id created when this suggestion was applied',
    field: 'appliedChangeId',
  })
  appliedChangeId!: number | null

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'createdAt',
    comment: 'When the suggestion was created',
  })
  createdAt!: Date

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'User who approved/rejected the suggestion',
    field: 'decidedBy',
  })
  decidedBy!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the suggestion was approved/rejected',
    field: 'decidedAt',
  })
  decidedAt!: Date | null
}
