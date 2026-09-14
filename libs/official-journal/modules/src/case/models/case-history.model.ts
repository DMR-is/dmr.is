// Association annotations use a type-only alias - see `src/models.md`.
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import type { AdvertTypeModel as AdvertTypeModelRef } from '../../advert-type/models'
import { AdvertTypeModel } from '../../advert-type/models'
import type {
  AdvertDepartmentModel as AdvertDepartmentModelRef,
  AdvertInvolvedPartyModel as AdvertInvolvedPartyModelRef,
} from '../../journal/models'
import {
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../../journal/models'
import { UserModel } from '../../user/models/user.model'
import type { CaseModel as CaseModelRef } from './case.model'
import { CaseModel } from './case.model'
import type { CaseStatusModel as CaseStatusModelRef } from './case-status.model'
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
    field: 'user_id',
    allowNull: true,
  })
  userId!: string | null

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
  case!: CaseModelRef

  @BelongsTo(() => AdvertDepartmentModel)
  department!: AdvertDepartmentModelRef

  @BelongsTo(() => AdvertTypeModel)
  type!: AdvertTypeModelRef

  @BelongsTo(() => CaseStatusModel)
  status!: CaseStatusModelRef

  @BelongsTo(() => AdvertInvolvedPartyModel)
  involvedParty!: AdvertInvolvedPartyModelRef

  @BelongsTo(() => UserModel)
  adminUser!: UserModel | null
}
