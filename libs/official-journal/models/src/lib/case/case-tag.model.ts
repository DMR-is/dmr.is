import {
  Column,
  DataType,
  DefaultScope,
  Model,
  Table,
} from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'

export enum CaseTagEnum {
  NotStarted = 'Ekki hafið',
  InReview = 'Í yfirlestri',
  MultipleReviewers = 'Samlesin',
  RequiresReview = 'Þarf skoðun',
}

@Table({ tableName: OfficialJournalModels.CASE_TAG, timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseTagModel extends Model {
  @Column({
    type: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: CaseTagEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
