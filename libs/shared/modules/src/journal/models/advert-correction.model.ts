import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

import { AdvertModel } from './advert.model'

@Table({ tableName: 'advert_correction' })
export class AdvertCorrectionModel extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({ allowNull: false })
  title!: string

  @Column({ allowNull: false })
  description!: string

  @Column({ field: 'document_html' })
  documentHtml!: string

  @Column({ field: 'document_pdf_url' })
  documentPdfUrl!: string

  @CreatedAt
  created!: Date

  @UpdatedAt
  updated!: Date

  @ForeignKey(() => AdvertModel)
  @Column({ type: DataType.UUID, allowNull: false, field: 'advert_id' })
  advertId!: string

  @BelongsTo(() => AdvertModel, 'advert_id')
  advert!: AdvertModel
}
