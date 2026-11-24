import { type FindOptions, Transaction, type WhereOptions } from 'sequelize'

import type { AdvertModel } from '../../models/advert.model'

/**
 * The one way to lock an advert row. Every writer that decides something from
 * an advert (the editor, both publish paths, foreclosure property changes and
 * the bulk move and its undo) takes this lock before it reads what the
 * decision depends on, so they run one at a time per advert.
 *
 * `NO_KEY_UPDATE` (`FOR NO KEY UPDATE`), not `UPDATE`: it conflicts with
 * itself, so it serialises the same writers, but it does not conflict with the
 * `FOR KEY SHARE` an FK-checking insert takes, so adding a comment or a
 * publication to an advert is not held up while it is locked. `UPDATE` would
 * make those inserts wait for the whole publish, TBR charge included.
 *
 * The read is plain (`unscoped()`): `FOR UPDATE`-family locks cannot combine
 * with the detailed scope's outer joins. Read the detailed advert after the
 * lock, never before.
 *
 * The lock is held until `transaction` ends. Without an explicit one, the
 * request's CLS transaction is used (Sequelize resolves it for reads), so the
 * lock is held until the response commits. Never pass a separate transaction
 * for a row the current transaction already holds or will write.
 */
const LOCK = Transaction.LOCK.NO_KEY_UPDATE

type LockOptions = {
  transaction?: Transaction
  /** `id` is always selected. */
  attributes?: string[]
}

const withId = (attributes: string[] = []) => [
  'id',
  ...attributes.filter((a) => a !== 'id'),
]

/** Locks one advert row and returns it (null when it does not exist). */
export const lockAdvertRow = (
  advertModel: typeof AdvertModel,
  advertId: string,
  { transaction, attributes }: LockOptions = {},
): Promise<AdvertModel | null> =>
  advertModel.unscoped().findByPk(advertId, {
    attributes: withId(attributes),
    transaction,
    lock: LOCK,
  })

/**
 * Locks every advert row matching `where`, in `id` order so two bulk writers
 * cannot wait on each other, and returns them.
 */
export const lockAdvertRows = (
  advertModel: typeof AdvertModel,
  where: WhereOptions,
  { transaction, attributes }: LockOptions = {},
): Promise<AdvertModel[]> => {
  const options: FindOptions = {
    where,
    attributes: withId(attributes),
    order: [['id', 'ASC']],
    transaction,
    lock: LOCK,
  }
  return advertModel.unscoped().findAll(options)
}
