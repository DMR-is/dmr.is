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
import { SignatureModel } from './signature.model'

@Table({ tableName: 'advert_signatures', timestamps: false })
export class AdvertSignaturesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => SignatureModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'signature_id',
  })
  signatureId!: string

  @PrimaryKey
  @ForeignKey(() => AdvertModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  advertId!: string

  @BelongsTo(() => SignatureModel, 'signature_id')
  signature!: SignatureModel

  @BelongsTo(() => AdvertModel, 'advert_id')
  case!: AdvertModel
}
