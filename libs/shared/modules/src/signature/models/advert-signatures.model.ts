import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { AdvertDTO } from '../../journal/models'
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
  @ForeignKey(() => AdvertDTO)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'advert_id',
  })
  advertId!: string

  @BelongsTo(() => SignatureModel, 'signature_id')
  signature!: SignatureModel

  @BelongsTo(() => AdvertDTO, 'advert_id')
  case!: AdvertDTO
}
