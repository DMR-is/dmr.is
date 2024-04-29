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

import { AdvertAttachmentsDTO } from './AdvertAttachments'
import { AdvertCategoryDTO } from './AdvertCategory'
import { AdvertDepartmentDTO } from './AdvertDepartment'
import { AdvertInvolvedPartyDTO } from './AdvertInvolvedParty'
import { AdvertStatusDTO } from './AdvertStatus'
import { AdvertTypeDTO } from './AdvertType'

@Table({ tableName: 'advert', timestamps: false })
export class AdvertDTO extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUID, field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentDTO, 'department_id')
  department!: AdvertDepartmentDTO

  @Column({ type: DataType.UUID, field: 'type_id' })
  typeId!: string

  @BelongsTo(() => AdvertTypeDTO, 'type_id')
  type!: AdvertTypeDTO

  @BelongsToMany(() => AdvertCategoryDTO, { through: 'advert_categories' })
  categories!: AdvertCategoryDTO[]

  @Column
  subject!: string

  @Column({ field: 'status_id' })
  statusId!: string

  @BelongsTo(() => AdvertStatusDTO, 'status_id')
  status!: AdvertStatusDTO

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

  @BelongsTo(() => AdvertInvolvedPartyDTO, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyDTO

  @Column({ field: 'is_legacy' })
  isLegacy!: boolean

  @Column({ field: 'document_html' })
  documentHtml!: string

  @Column({ field: 'document_pdf_url' })
  documentPdfUrl!: string

  @HasMany(() => AdvertAttachmentsDTO, 'id')
  attachments!: AdvertAttachmentsDTO[]

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date
}
