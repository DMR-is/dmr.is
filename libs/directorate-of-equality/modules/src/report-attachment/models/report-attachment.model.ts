// Association annotations use a type-only alias — see `src/models.ts`.
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { ImmutableModel, ImmutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../constants'
import type { ReportModel as ReportModelRef } from '../../report/models/report.model'
import { ReportModel } from '../../report/models/report.model'

/** The file types a company may attach. Mirrors the table's CHECK. */
export enum ReportAttachmentExtensionEnum {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  XLS = 'xls',
}

type ReportAttachmentAttributes = {
  reportId: string
  filename: string
  extension: ReportAttachmentExtensionEnum
  sizeBytes: number
  content: Buffer
}

type ReportAttachmentCreateAttributes = ReportAttachmentAttributes

/** Scope name for the one read that needs the bytes: the download. */
export const REPORT_ATTACHMENT_WITH_CONTENT = 'withContent'

/**
 * A supporting file (fylgiskjal) sent with an equality report — an Excel action
 * plan, say — next to the one main plan stored on `report` itself.
 *
 * Reviewer-only: never merged into the approval PDF, mailed or archived.
 *
 * ⚠️ **The default scope leaves out `content`.** Up to 4 MB per row, so a
 * list or an include must never pull it by accident; only the download asks for
 * it, through {@link REPORT_ATTACHMENT_WITH_CONTENT}.
 */
@DefaultScope(() => ({ attributes: { exclude: ['content'] } }))
@Scopes(() => ({ [REPORT_ATTACHMENT_WITH_CONTENT]: {} }))
@ImmutableTable({ tableName: DoeModels.REPORT_ATTACHMENT })
export class ReportAttachmentModel extends ImmutableModel<
  ReportAttachmentAttributes,
  ReportAttachmentCreateAttributes
> {
  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'report_id' })
  reportId!: string

  /** As the company uploaded it; shown to the reviewer and used on download. */
  @Column({ type: DataType.TEXT, allowNull: false })
  filename!: string

  /** Checked against the file's signature before insert. */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
    values: Object.values(ReportAttachmentExtensionEnum),
  })
  extension!: ReportAttachmentExtensionEnum

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'size_bytes' })
  sizeBytes!: number

  @Column({ type: DataType.BLOB, allowNull: false })
  content!: Buffer

  @BelongsTo(() => ReportModel, { foreignKey: 'reportId', as: 'report' })
  report?: ReportModelRef
}
