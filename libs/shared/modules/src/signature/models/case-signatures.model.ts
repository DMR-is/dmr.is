import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

import { CaseDto } from '../../case/models'
import { SignatureModel } from './signature.model'

@Table({ tableName: 'case_signatures', timestamps: false })
export class CaseSignaturesModel extends Model {
  @PrimaryKey
  @ForeignKey(() => SignatureModel)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'signature_id',
  })
  signatureId!: string

  @PrimaryKey
  @ForeignKey(() => CaseDto)
  @Column({
    type: DataType.UUIDV4,
    allowNull: false,
    field: 'case_case_id',
  })
  caseId!: string

  @BelongsTo(() => SignatureModel, 'signature_id')
  signature!: SignatureModel

  @BelongsTo(() => CaseDto, 'case_case_id')
  case!: CaseDto
}
