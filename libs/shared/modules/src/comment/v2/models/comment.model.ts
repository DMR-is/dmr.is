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

import { AdminUserModel } from '../../../admin-user/models/admin-user.model'
import { ApplicationUserModel } from '../../../application-user/models'
import { CaseModel, CaseStatusModel } from '../../../case/models'
import { AdvertInvolvedPartyModel } from '../../../journal/models'
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

  @ForeignKey(() => ApplicationUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'application_user_creator_id',
  })
  applicationUserCreatorId!: string | null

  @ForeignKey(() => AdminUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'admin_user_creator_id',
  })
  adminUserCreatorId!: string | null

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

  @ForeignKey(() => AdminUserModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
    field: 'admin_user_receiver_id',
  })
  adminUserReceiverId!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'comment',
  })
  comment!: string | null

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => CaseStatusModel, {
    foreignKey: 'case_status_id',
    as: 'createdCaseStatus',
  })
  createdCaseStatus!: CaseStatusModel

  @BelongsTo(() => CaseActionModel)
  caseAction!: CaseActionModel

  @BelongsTo(() => ApplicationUserModel)
  applicationUserCreator?: ApplicationUserModel

  @BelongsTo(() => AdminUserModel, {
    foreignKey: 'admin_user_creator_id',
    as: 'adminUserCreator',
  })
  adminUserCreator?: AdminUserModel

  @BelongsTo(() => AdvertInvolvedPartyModel)
  institutionCreator?: AdvertInvolvedPartyModel

  @BelongsTo(() => CaseStatusModel, {
    foreignKey: 'case_status_receiver_id',
    as: 'caseStatusReceiver',
  })
  caseStatusReceiver?: CaseStatusModel

  @BelongsTo(() => AdminUserModel, {
    foreignKey: 'admin_user_receiver_id',
    as: 'adminUserReceiver',
  })
  adminUserReceiver?: AdminUserModel
}
