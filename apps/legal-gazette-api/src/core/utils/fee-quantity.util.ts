import { type Logger } from '@dmr.is/logging'

import { AdvertTemplateType } from '../enums/advert-template-type.enum'
import { TypeIdEnum } from '../enums/type-id.enum'
import { idEquals } from './id.util'

/**
 * Every property in a nauðungarsala advert is introduced by this label. The
 * advert is billed once per property, so the label count is the fee quantity.
 */
const FORECLOSURE_PROPERTY_LABEL = /Heiti eignar:/g

const isForeclosure = (typeId: string | null | undefined): boolean =>
  idEquals(typeId, TypeIdEnum.FORECLOSURE)

/**
 * The fee quantity a free-text advert should be billed for, derived from its
 * type and HTML. `undefined` means the type is not billed per item and the
 * price calculator falls back to the fee code's flat or text-length price.
 *
 * Creating an advert goes through this; every later change to its type,
 * content or properties goes through `feeQuantityForChange`. A missing
 * quantity is not an error anywhere downstream, it silently bills one unit.
 */
export const resolveFeeQuantity = (
  typeId: string | null | undefined,
  content: string | null | undefined,
): number | undefined => {
  if (!isForeclosure(typeId)) {
    return undefined
  }

  return content?.match(FORECLOSURE_PROPERTY_LABEL)?.length ?? 0
}

/**
 * Content-derived rule for a free-text advert whose type or content changed.
 *
 * - `number`: the advert is a foreclosure, re-derived from its content.
 * - `null`: the advert stopped being a foreclosure, so the property count it
 *   carried must not be multiplied into the new type's fee code (every price
 *   path multiplies any positive quantity, whatever the type).
 * - `undefined`: leave the column as it is; neither side is content-billed,
 *   and a quantity set explicitly by an external system must survive.
 */
const feeQuantityAfterChange = ({
  previousTypeId,
  typeId,
  content,
}: {
  previousTypeId: string | null | undefined
  typeId: string | null | undefined
  content: string | null | undefined
}): number | null | undefined => {
  if (isForeclosure(typeId)) {
    return resolveFeeQuantity(typeId, content)
  }

  if (isForeclosure(previousTypeId)) {
    return null
  }

  return undefined
}

/**
 * Whether the advert's fee quantity is frozen: TBR billed it on publication A
 * (`transactionId`), or it came from the old system and was billed there
 * (`legacyId`). The column is then the record of what was billed.
 */
export const isFeeQuantityFrozen = (advert: {
  transactionId?: string | null
  legacyId?: string | null
}): boolean => Boolean(advert.transactionId || advert.legacyId)

/**
 * The single keep / recompute / clear decision for an advert whose type,
 * content, properties or explicit quantity change. The editor, the bulk type
 * move and the foreclosure property endpoints all go through it, so their
 * guards cannot drift apart. `undefined` leaves the column untouched; `null`
 * clears it.
 *
 * - A frozen (charged or legacy) advert keeps its quantity.
 * - An explicit quantity from the editor wins over anything derived.
 * - A template foreclosure has no property labels in `content`; its count is
 *   the number of `foreclosure_property` rows, which the caller passes as
 *   `propertyCount`. It is recounted whenever the advert is a foreclosure, so
 *   a move away and back restores it, and cleared while it is anything else.
 * - Anything else is derived from `content`.
 */
export const feeQuantityForChange = ({
  advert,
  previousTypeId,
  typeId,
  content,
  propertyCount,
  explicitQuantity,
}: {
  advert: {
    templateType: AdvertTemplateType
    transactionId?: string | null
    legacyId?: string | null
  }
  previousTypeId: string | null | undefined
  typeId: string | null | undefined
  content: string | null | undefined
  propertyCount?: number
  explicitQuantity?: number
}): number | null | undefined => {
  if (isFeeQuantityFrozen(advert)) {
    return undefined
  }

  if (explicitQuantity !== undefined) {
    return explicitQuantity
  }

  if (advert.templateType === AdvertTemplateType.FORECLOSURE) {
    return isForeclosure(typeId) ? propertyCount : null
  }

  return feeQuantityAfterChange({ previousTypeId, typeId, content })
}

/**
 * A per-item advert that resolves to no items is billed one flat unit by
 * every price path, which is the failure per-property billing exists to
 * prevent. Nobody can correct it for a content-derived foreclosure, so make
 * it visible wherever a quantity is written.
 */
export const warnOnZeroFeeQuantity = (
  logger: Logger,
  {
    advertId,
    typeId,
    feeQuantity,
    context,
  }: {
    advertId: string | undefined
    typeId: string | null | undefined
    feeQuantity: number | null | undefined
    context: string
  },
): void => {
  if (feeQuantity !== 0) {
    return
  }

  logger.warn('Per-item advert resolved to zero items, billing a flat fee', {
    advertId,
    typeId,
    context,
  })
}
