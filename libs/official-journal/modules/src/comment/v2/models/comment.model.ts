// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type {
  CaseModel as CaseModelRef,
  CaseStatusModel as CaseStatusModelRef,
} from '../../../case/models'
import { CaseModel, CaseStatusModel } from '../../../case/models'
import type { AdvertInvolvedPartyModel as AdvertInvolvedPartyModelRef } from '../../../journal/models'
import { AdvertInvolvedPartyModel } from '../../../journal/models'
import type { UserModel as UserModelRef } from '../../../user/models/user.model'
import { UserModel } from '../../../user/models/user.model'
import type { CaseActionModel as CaseActionModelRef } from './case-action.model'
import { CaseActionModel } from './case-action.model'

@DefaultScope(() => ({
  order: [['created_at', 'ASC']],
}))
@Table({
  tableName: 'comment_v2',
  timestamps: false,
})
export class CommentModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'id',
  })
  override id!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'created_at',
  })
  created!: string

  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'case_id',
  })
  caseId!: string

  @ForeignKey(() => CaseStatusModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_status_id',
  })
  createdStatusId!: string

  @ForeignKey(() => CaseActionModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_action_id',
  })
  caseActionId!: string

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'user_creator_id',
  })
  userCreatorId!: string | null

  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'institution_creator_id',
  })
  institutionCreatorId!: string | null

  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'case_status_receiver_id',
  })
  caseStatusReceiverId!: string | null

  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'application_user_name',
  })
  applicationUserName!: string | null

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'user_receiver_id',
  })
  userReceiverId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'comment',
  })
  comment!: string | null

  @BelongsTo(() => CaseModel)
  case!: CaseModelRef

  @BelongsTo(() => CaseStatusModel, {
    foreignKey: 'case_status_id',
    as: 'createdCaseStatus',
  })
  createdCaseStatus!: CaseStatusModelRef

  @BelongsTo(() => CaseActionModel)
  caseAction!: CaseActionModelRef

  @BelongsTo(() => UserModel, {
    as: 'userCreator',
  })
  userCreator?: UserModelRef

  @BelongsTo(() => AdvertInvolvedPartyModel)
  institutionCreator?: AdvertInvolvedPartyModelRef

  @BelongsTo(() => CaseStatusModel, {
    foreignKey: 'case_status_receiver_id',
    as: 'caseStatusReceiver',
  })
  caseStatusReceiver?: CaseStatusModelRef

  @BelongsTo(() => UserModel, {
    foreignKey: 'user_receiver_id',
    as: 'userReceiver',
  })
  userReceiver?: UserModelRef
}
