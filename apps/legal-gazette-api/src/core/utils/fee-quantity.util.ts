import { AdvertTemplateType } from '../../models/advert.model'
import { TypeIdEnum } from '../../models/type.model'
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
 * Every path that creates or edits advert content must go through this or
 * `feeQuantityAfterChange`: a missing quantity is not an error anywhere
 * downstream, it silently bills a single unit.
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
 * The fee quantity to write after an advert's type or content changed.
 *
 * - `number`: the advert is a foreclosure, re-derived from its content.
 * - `null`: the advert stopped being a foreclosure, so the property count it
 *   carried must not be multiplied into the new type's fee code.
 * - `undefined`: leave the column as it is; neither side is content-billed,
 *   and a quantity set explicitly by an external system must survive.
 */
export const feeQuantityAfterChange = ({
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
 * The single keep / recompute / clear decision for an advert whose type or
 * content is being changed, shared by the editor and the bulk type move so
 * their guards cannot drift apart.
 *
 * - A charged advert keeps its quantity: TBR billed it on publication A, and
 *   the column is what a later correction reads to know what was billed.
 * - A legacy advert was never billed here; it is left alone.
 * - A template foreclosure counts its properties outside `content`, so it keeps
 *   the externally set quantity while it stays a foreclosure, and is cleared
 *   once it is retyped to something else.
 * - Anything else follows `feeQuantityAfterChange`.
 */
export const feeQuantityForChange = ({
  advert,
  typeId,
  content,
}: {
  advert: {
    typeId: string | null | undefined
    templateType: AdvertTemplateType
    transactionId?: string | null
    legacyId?: string | null
  }
  typeId: string | null | undefined
  content: string | null | undefined
}): number | null | undefined => {
  if (advert.transactionId || advert.legacyId) {
    return undefined
  }

  if (advert.templateType === AdvertTemplateType.FORECLOSURE) {
    return isForeclosure(typeId) ? undefined : null
  }

  return feeQuantityAfterChange({
    previousTypeId: advert.typeId,
    typeId,
    content,
  })
}
