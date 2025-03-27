import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript'

import { AdvertTypeModel } from '@dmr.is/official-journal/modules/advert-type'
import { AdvertAttachmentsModel } from './advert-attachments.model'
import { AdvertCategoriesModel } from './advert-categories.model'
import { AdvertCategoryModel } from './advert-category.model'
import { AdvertCorrectionModel } from './advert-correction.model'
import { AdvertDepartmentModel } from './advert-department.model'
import { AdvertInvolvedPartyModel } from './advert-involved-party.model'
import { AdvertStatusModel } from './advert-status.model'

@Table({ tableName: 'advert', timestamps: false })
export class AdvertModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ type: DataType.UUID, field: 'department_id' })
  departmentId!: string

  @BelongsTo(() => AdvertDepartmentModel, 'department_id')
  department!: AdvertDepartmentModel

  @Column({ type: DataType.UUID, field: 'type_id' })
  typeId!: string

  @BelongsTo(() => AdvertTypeModel, 'type_id')
  type!: AdvertTypeModel

  @BelongsToMany(() => AdvertCategoryModel, {
    through: { model: () => AdvertCategoriesModel },
  })
  categories?: AdvertCategoryModel[]

  @Column
  subject!: string

  @Column({ field: 'status_id' })
  statusId!: string

  @BelongsTo(() => AdvertStatusModel, 'status_id')
  status!: AdvertStatusModel

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

  @BelongsTo(() => AdvertInvolvedPartyModel, 'involved_party_id')
  involvedParty!: AdvertInvolvedPartyModel

  @Column({ field: 'is_legacy' })
  isLegacy!: boolean

  @Column({ field: 'document_html' })
  documentHtml!: string

  @Column({ field: 'document_pdf_url' })
  documentPdfUrl!: string

  @Column
  created!: Date

  @Column
  updated!: Date

  @HasMany(() => AdvertAttachmentsModel, 'advert_id')
  attachments!: AdvertAttachmentsModel[]

  @HasMany(() => AdvertCorrectionModel, 'advert_id')
  corrections?: AdvertCorrectionModel[]
}
