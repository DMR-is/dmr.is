import { TypeIdEnum } from '../../models/type.model'
import { idEquals } from './id.util'

/**
 * Every property in a nauðungarsala advert is introduced by this label. The
 * advert is billed once per property, so the label count is the fee quantity.
 */
const FORECLOSURE_PROPERTY_LABEL = /Heiti eignar:/g

/**
 * The fee quantity a free-text advert should be billed for, derived from its
 * type and HTML. `undefined` means the type is not billed per item and the
 * price calculator falls back to the fee code's flat or text-length price.
 *
 * Every path that creates or edits advert content must go through this: a
 * missing quantity is not an error anywhere downstream, it silently bills a
 * single unit.
 */
export const resolveFeeQuantity = (
  typeId: string | null | undefined,
  content: string | null | undefined,
): number | undefined => {
  if (!idEquals(typeId, TypeIdEnum.FORECLOSURE)) {
    return undefined
  }

  return content?.match(FORECLOSURE_PROPERTY_LABEL)?.length ?? 0
}
