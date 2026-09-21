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

import type { CaseModel as CaseModelRef } from '../../case/models'
import { CaseModel } from '../../case/models'
import type { ApplicationAttachmentModel as ApplicationAttachmentModelRef } from './application-attachment.model'
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
  attachment!: ApplicationAttachmentModelRef

  @BelongsTo(() => CaseModel, 'case_case_id')
  case!: CaseModelRef
}
