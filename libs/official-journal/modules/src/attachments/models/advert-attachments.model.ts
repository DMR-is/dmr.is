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

import type { AdvertModel as AdvertModelRef } from '../../journal/models'
import { AdvertModel } from '../../journal/models'
import type { ApplicationAttachmentModel as ApplicationAttachmentModelRef } from './application-attachment.model'
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
  attachment!: ApplicationAttachmentModelRef

  @BelongsTo(() => AdvertModel, 'advert_id')
  advert!: AdvertModelRef
}
