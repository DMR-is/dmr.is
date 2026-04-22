import { Column, DataType } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import type { ConfigDto } from '../dto/config.dto'

type ConfigAttributes = {
  key: string
  value: string
  description: string | null
  supersededAt: Date | null
}

type ConfigCreateAttributes = {
  key: string
  value: string
  description?: string | null
  supersededAt?: Date | null
}

@MutableTable({ tableName: DoeModels.CONFIG })
export class ConfigModel extends MutableModel<
  ConfigAttributes,
  ConfigCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  key!: string

  @Column({ type: DataType.TEXT, allowNull: false })
  value!: string

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'superseded_at',
  })
  supersededAt!: Date | null

  static fromModel(model: ConfigModel): ConfigDto {
    return {
      id: model.id,
      key: model.key,
      value: model.value,
      description: model.description,
      supersededAt: model.supersededAt,
    }
  }

  fromModel(): ConfigDto {
    return ConfigModel.fromModel(this)
  }
}
