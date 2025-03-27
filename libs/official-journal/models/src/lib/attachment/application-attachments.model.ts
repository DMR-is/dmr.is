import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { ApplicationAttachmentModel } from './application-attachment.model'
import { OfficialJournalModels } from '../constants'

@Table({
  tableName: OfficialJournalModels.APPLICATION_ATTACHMENTS,
  timestamps: false,
})
export class ApplicationAttachmentsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => ApplicationAttachmentModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'attachment_id',
  })
  attachmentId!: string

  @PrimaryKey
  @ForeignKey(() => ApplicationAttachmentModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'application_id',
  })
  applicationId!: string

  @BelongsTo(() => ApplicationAttachmentModel, 'attachment_id')
  attachment!: ApplicationAttachmentModel
}
