import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertAttachments } from './AdvertAttachments'
import { AdvertCategory } from './AdvertCategory'
import { AdvertDepartment } from './AdvertDepartment'
import { AdvertInvolvedParty } from './AdvertInvolvedParty'
import { AdvertStatus } from './AdvertStatus'
import { AdvertType } from './AdvertType'

@Table({ tableName: 'advert', timestamps: false })
export class Advert extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUID, field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartment, 'department_id')
  department!: AdvertDepartment

  @Column({ type: DataType.UUID, field: 'type_id' })
  typeId!: string

  @BelongsTo(() => AdvertType, 'type_id')
  type!: AdvertType

  @BelongsToMany(() => AdvertCategory, { through: 'advert_categories' })
  categories!: AdvertCategory[]

  @Column
  subject!: string

  @Column({ field: 'status_id' })
  statusId!: string

  @BelongsTo(() => AdvertStatus, 'status_id')
  status!: AdvertStatus

  @Column({ field: 'serial_number' })
  serialNumber!: number

  @Column({ field: 'publication_year' })
  publicationYear!: number

  @Column({ type: DataType.DATE, field: 'signature_date' })
  signatureDate!: Date

  @Column({ type: DataType.DATE, field: 'publication_date' })
  publicationDate!: Date

  @Column({ field: 'involved_party_id' })
  involvedPartyId!: string

  @BelongsTo(() => AdvertInvolvedParty, 'involved_party_id')
  involvedParty!: AdvertInvolvedParty

  @Column({ field: 'is_legacy' })
  isLegacy!: boolean

  @Column({ field: 'document_html' })
  documentHtml!: string

  @Column({ field: 'document_pdf_url' })
  documentPdfUrl!: string

  @HasMany(() => AdvertAttachments, 'id')
  attachments!: AdvertAttachments[]

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
