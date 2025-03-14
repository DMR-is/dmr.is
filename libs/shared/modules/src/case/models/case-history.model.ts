import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertTypeModel } from '../../advert-type/models'
import {
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
import { UserModel } from '../../user/models/user.model'
import { CaseModel } from './case.model'
import { CaseStatusModel } from './case-status.model'

@Table({ tableName: 'case_history', timestamps: false })
export class CaseHistoryModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    field: 'id',
    allowNull: false,
  })
  override id!: string

  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.UUIDV4,
    field: 'case_id',
    allowNull: false,
  })
  caseId!: string

  @ForeignKey(() => AdvertDepartmentModel)
  @Column({
    type: DataType.UUID,
    field: 'department_id',
    allowNull: false,
  })
  departmentId!: string

  @ForeignKey(() => AdvertTypeModel)
  @Column({
    type: DataType.UUID,
    field: 'type_id',
    allowNull: false,
  })
  typeId!: string

  @ForeignKey(() => CaseStatusModel)
  @Column({
    type: DataType.UUID,
    field: 'status_id',
    allowNull: false,
  })
  statusId!: string

  @ForeignKey(() => AdvertInvolvedPartyModel)
  @Column({
    type: DataType.UUID,
    field: 'institution_id',
    allowNull: false,
  })
  involvedPartyId!: string

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUID,
    field: 'admin_user_id',
    allowNull: true,
  })
  adminUserId!: string | null

  @Column({
    type: DataType.STRING,
    field: 'title',
    allowNull: false,
  })
  title!: string

  @Column({
    type: DataType.TEXT,
    field: 'html',
    allowNull: false,
  })
  html!: string

  @Column({
    type: DataType.STRING,
    field: 'requested_publication_date',
    allowNull: true,
  })
  requestedPublicationDate!: string | null

  @Column({
    type: DataType.STRING,
    field: 'created_at',
    allowNull: false,
  })
  created!: string

  @BelongsTo(() => CaseModel)
  case!: CaseModel

  @BelongsTo(() => AdvertDepartmentModel)
  department!: AdvertDepartmentModel

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModel

  @BelongsTo(() => CaseStatusModel)
  status!: CaseStatusModel

  @BelongsTo(() => AdvertInvolvedPartyModel)
  involvedParty!: AdvertInvolvedPartyModel

  @BelongsTo(() => UserModel)
  adminUser!: UserModel | null
}
