import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseModel } from '../../case/models'
import { ApplicationAttachmentModel } from './application-attachment.model'

@Table({ tableName: 'case_attachments', timestamps: false })
export class CaseAttachmentsModel extends Model {
  @PrimaryKey
  @ForeignKey(() => ApplicationAttachmentModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'attachment_id',
  })
  attachmentId!: string

  @PrimaryKey
  @ForeignKey(() => CaseModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @BelongsTo(() => ApplicationAttachmentModel, 'attachment_id')
  attachment!: ApplicationAttachmentModel

  @BelongsTo(() => CaseModel, 'case_case_id')
  case!: CaseModel
}
