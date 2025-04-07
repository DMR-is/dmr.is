import {
  Column,
  DataType,
  DefaultScope,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'

import { OfficialJournalModels } from '../constants'
import { CaseModel } from './case.model'

export enum CaseStatusEnum {
  Submitted = 'Innsent',
  InProgress = 'Grunnvinnsla',
  InReview = 'Yfirlestur',
  ReadyForPublishing = 'Tilbúið',
  Published = 'Útgefið',
  Unpublished = 'Tekið úr birtingu',
  Rejected = 'Birtingu hafnað',
}

@Table({ tableName: OfficialJournalModels.CASE_STATUS, timestamps: false })
@DefaultScope(() => ({
  attributes: {
    exclude: ['created', 'updated'],
  },
}))
export class CaseStatusModel extends Model {
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
  title!: CaseStatusEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string

  @HasMany(() => CaseModel, 'statusId')
  cases?: CaseModel[]
}
