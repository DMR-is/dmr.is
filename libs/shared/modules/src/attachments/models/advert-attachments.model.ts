import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertModel } from '../../journal/models'
import { ApplicationAttachmentModel } from './application-attachment.model'

@Table({ tableName: 'Advert_attachments', timestamps: false })
export class AdvertAttachmentsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => ApplicationAttachmentModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'attachment_id',
  })
  attachmentId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  advertId!: string

  @BelongsTo(() => ApplicationAttachmentModel, 'attachment_id')
  attachment!: ApplicationAttachmentModel

  @BelongsTo(() => AdvertModel, 'advert_id')
  advert!: AdvertModel
}
