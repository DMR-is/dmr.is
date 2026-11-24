import { CreatedAt } from 'sequelize-typescript'

import {
  AbstractDmrModel,
  AbstractDmrModelAttributes,
} from './abstract-dmr.model'

export type ImmutableModelAttributes = AbstractDmrModelAttributes & {
  createdAt: Date
}

/**
 * Base class for tables where rows are never mutated after insert.
 * Two common shapes:
 *   - Pure join tables (M:N bridges) where row existence is the association.
 *   - Append-only audit / snapshot tables (events, published aggregates).
 * Schema is `id + created_at` — no `updated_at`, no `deleted_at`.
 */
export abstract class ImmutableModel<
  TAttributes = any,
  TCreateAttributes extends {} = any,
> extends AbstractDmrModel<
  TAttributes & ImmutableModelAttributes,
  TCreateAttributes
> {
  @CreatedAt
  declare createdAt: Date
}
