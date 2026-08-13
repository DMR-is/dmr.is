import { Op, WhereOptions } from 'sequelize'

import { TypeIdEnum } from '../../models/type.model'
import { StatusIdEnum } from '../enums/status.enum'

/**
 * Advert statuses that take an advert out of play.
 *
 * Narrower on purpose than NON_EDITABLE_STATUSES in advert-status.util.ts: that
 * set answers "may an editor still change this advert" and therefore counts
 * PUBLISHED. Here PUBLISHED is the opposite of terminal - a published Skiptalok
 * is exactly what closes an estate.
 */
export const TERMINATED_ADVERT_STATUSES = [
  StatusIdEnum.REJECTED,
  StatusIdEnum.WITHDRAWN,
]

/**
 * Postgres returns UUID columns lower-cased while the id enums are written
 * upper-case, so `advert.typeId === TypeIdEnum.X` is always false. Compare ids
 * through this, or let the database do the comparison.
 */
const idEquals = (a: string | null | undefined, b: string): boolean =>
  a?.toLowerCase() === b.toLowerCase()

/**
 * A Skiptalok that still counts - either on its way to publication or already
 * published. Rejected and withdrawn ones do not, which is what lets an
 * advertiser submit a replacement.
 */
export const isLiveDivisionEnding = (advert: {
  typeId: string
  statusId: string
}): boolean =>
  idEquals(advert.typeId, TypeIdEnum.DIVISION_ENDING) &&
  !TERMINATED_ADVERT_STATUSES.some((statusId) =>
    idEquals(advert.statusId, statusId),
  )

/**
 * Restricts a query to adverts that still count. Deadline rules are derived
 * from earlier adverts, and an advert an editor rejected never reached the
 * public, so it must not push later deadlines around.
 */
export const notTerminatedWhere = {
  statusId: { [Op.notIn]: TERMINATED_ADVERT_STATUSES },
}

/**
 * The same rule as {@link isLiveDivisionEnding}, expressed for the database
 * rather than for an already loaded list. Keep the two in step.
 */
export const liveDivisionEndingWhere = (
  applicationId: string,
): WhereOptions => ({
  applicationId,
  typeId: TypeIdEnum.DIVISION_ENDING,
  ...notTerminatedWhere,
})

/**
 * An estate stays open for new Skiptafundur and Skiptalok adverts until a
 * Skiptalok is live.
 *
 * This is decided by the adverts rather than by application.status because the
 * status cannot express "the Skiptalok was rejected, so the estate is open
 * again" - it is written once when a Skiptalok publishes and has no reverse
 * edge.
 */
export const isEstateOpen = (
  adverts: { typeId: string; statusId: string }[],
): boolean => !adverts.some(isLiveDivisionEnding)
