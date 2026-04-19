import { CreatedAt, DeletedAt, UpdatedAt } from 'sequelize-typescript'

import {
  AbstractDmrModel,
  AbstractDmrModelAttributes,
  AbstractDmrModelStatic,
} from './abstract-dmr.model'

export type ParanoidModelAttributes = AbstractDmrModelAttributes & {
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type ParanoidModelStatic<T extends ParanoidModel = ParanoidModel> =
  AbstractDmrModelStatic<T>

export abstract class ParanoidModel<
  TAttributes = any,
  TCreateAttributes extends {} = any,
> extends AbstractDmrModel<TAttributes & ParanoidModelAttributes, TCreateAttributes> {
  @CreatedAt
  declare createdAt: Date

  @UpdatedAt
  declare updatedAt: Date

  @DeletedAt
  declare deletedAt: Date | null
}
