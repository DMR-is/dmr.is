import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript'

import { ApplicationAttachmentTypeModel } from './application-attachment-type.model'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.APPLICATION_ATTACHMENT,
  timestamps: false,
})
export class ApplicationAttachmentModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'application_id',
  })
  applicationId!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'original_file_name',
  })
  originalFileName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_name',
  })
  fileName!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_format',
  })
  fileFormat!: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_extension',
  })
  fileExtension!: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'file_size',
  })
  fileSize!: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_location',
  })
  fileLocation!: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'deleted',
  })
  deleted!: boolean

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'type_id',
  })
  typeId!: string

  @BelongsTo(() => ApplicationAttachmentTypeModel, 'type_id')
  type!: ApplicationAttachmentTypeModel
}
