import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from './case.model'
import { CaseStatusModel } from './case-status.model'
import { OfficialJournalModels } from '../constants'
import { AdvertTypeModel } from '../advert-type/advert-type.model'
import { AdvertDepartmentModel } from '../journal/advert-department.model'
import { AdvertInvolvedPartyModel } from '../institution/institution.model'
import { UserModel } from '../user/user.model'

interface CaseHistoryAttributes {
  id: string
  caseId: string
  departmentId: string
  typeId: string
  statusId: string
  involvedPartyId: string
  userId: string | null
  title: string
  html: string
  requestedPublicationDate: string | null
  created: string
}

interface CreateCaseHistoryAttributes
  extends Omit<CaseHistoryAttributes, 'id' | 'created'> {
  caseId: string
  departmentId: string
  typeId: string
  statusId: string
  involvedPartyId: string
  userId: string | null
  title: string
  html: string
  requestedPublicationDate: string | null
}

@Table({ tableName: OfficialJournalModels.CASE_HISTORY, timestamps: false })
export class CaseHistoryModel extends Model<
  CaseHistoryAttributes,
  CreateCaseHistoryAttributes
> {
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

  static async createHistoryByCaseId(caseId: string): Promise<{ id: string }> {
    const caseLookup = await CaseModel.unscoped().findByPk(caseId, {
      attributes: [
        'id',
        'departmentId',
        'advertTypeId',
        'involvedPartyId',
        'statusId',
        'assignedUserId',
        'html',
        'advertTitle',
        'requestedPublicationDate',
      ],
    })

    if (!caseLookup) {
      throw new Error(`Case with ID ${caseId} not found`)
    }

    const caseHistory = await this.create({
      caseId: caseId,
      departmentId: caseLookup.departmentId,
      typeId: caseLookup.advertTypeId,
      statusId: caseLookup.statusId,
      involvedPartyId: caseLookup.involvedPartyId,
      userId: caseLookup.assignedUserId,
      title: caseLookup.advertTitle,
      html: caseLookup.html,
      requestedPublicationDate: caseLookup.requestedPublicationDate,
    })

    if (!caseHistory) {
      throw new Error(`Failed to create case history for case ID ${caseId}`)
    }

    return { id: caseHistory.id }
  }
}
