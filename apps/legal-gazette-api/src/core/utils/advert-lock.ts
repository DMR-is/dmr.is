import { getNamespace } from 'cls-hooked'
import { type FindOptions, Transaction, type WhereOptions } from 'sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'

import type { AdvertModel } from '../../models/advert.model'

/**
 * The one way to lock an advert row. The writers that take it are the editor
 * (`updateAdvert`), both publish paths (`advert-publish.service.ts` and the
 * publishing task), the publication reschedule (`updatePublication`), foreclosure property add and delete, the bulk move and
 * its undo, and the status transitions in `advert.service.ts` (`rejectAdvert`,
 * `moveAdvertToNextStatus`, `moveAdvertToPreviousStatus`,
 * `markAdvertAsWithdrawn`). Each takes it before it reads what its decision
 * depends on, so these run one at a time per advert.
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
 * `NO_KEY_UPDATE` also means a publish does not wait for an uncommitted
 * publication insert, so the "all published" read in `advert-publish.service.ts`
 * can miss a publication added in the same window.
 *
 * The lock is held until `transaction` ends. Without an explicit one, the
 * request's CLS transaction is used, so the lock is held until the response
 * commits. With neither, the lock would autocommit and protect nothing, so it
 * throws. Never pass a separate transaction for a row the current transaction
 * already holds or will write.
 */
const LOCK = Transaction.LOCK.NO_KEY_UPDATE

type LockOptions = {
  transaction?: Transaction
  /** `id` is always selected. */
  attributes?: string[]
}

/** The explicit transaction, else the request's CLS one; throws with neither. */
export const resolveTransaction = (explicit?: Transaction): Transaction => {
  const transaction: Transaction | undefined =
    explicit ?? getNamespace(CLS_NAMESPACE)?.get('transaction')

  if (!transaction) {
    throw new Error(
      'Locking an advert row needs a transaction: pass one, or call within a request',
    )
  }

  return transaction
}

const withId = (attributes: string[] = []) => [
  'id',
  ...attributes.filter((a) => a !== 'id'),
]

/** Locks one advert row and returns it (null when it does not exist). */
export const lockAdvertRow = async (
  advertModel: typeof AdvertModel,
  advertId: string,
  { transaction, attributes }: LockOptions = {},
): Promise<AdvertModel | null> =>
  advertModel.unscoped().findByPk(advertId, {
    attributes: withId(attributes),
    transaction: resolveTransaction(transaction),
    lock: LOCK,
  })

/**
 * Locks every advert row matching `where`, in `id` order so two bulk writers
 * cannot wait on each other, and returns them.
 */
export const lockAdvertRows = async (
  advertModel: typeof AdvertModel,
  where: WhereOptions,
  { transaction, attributes }: LockOptions = {},
): Promise<AdvertModel[]> => {
  const options: FindOptions = {
    where,
    attributes: withId(attributes),
    order: [['id', 'ASC']],
    transaction: resolveTransaction(transaction),
    lock: LOCK,
  }
  return advertModel.unscoped().findAll(options)
}
