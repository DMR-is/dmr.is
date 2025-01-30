import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'
import { CaseActionEnum } from '@dmr.is/shared/dto'

@Table({ tableName: 'case_action', timestamps: false })
export class CaseActionModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
  override id!: string

  @Column({
    type: DataType.ENUM(...Object.values(CaseActionEnum)),
    allowNull: false,
  })
  title!: CaseActionEnum

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  slug!: string
}
