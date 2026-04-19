import { CreatedAt, UpdatedAt } from 'sequelize-typescript'

import {
  AbstractDmrModel,
  AbstractDmrModelAttributes,
  AbstractDmrModelStatic,
} from './abstract-dmr.model'

export type MutableModelAttributes = AbstractDmrModelAttributes & {
  createdAt: Date
  updatedAt: Date
}

export type MutableModelStatic<T extends MutableModel = MutableModel> =
  AbstractDmrModelStatic<T>

/**
 * Base class for tables that track creation + mutation time but do NOT
 * soft-delete. Matches a schema of `id + created_at + updated_at`.
 */
export abstract class MutableModel<
  TAttributes = any,
  TCreateAttributes extends {} = any,
> extends AbstractDmrModel<
  TAttributes & MutableModelAttributes,
  TCreateAttributes
> {
  @CreatedAt
  declare createdAt: Date

  @UpdatedAt
  declare updatedAt: Date
}
