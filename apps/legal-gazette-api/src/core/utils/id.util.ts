/**
 * Postgres returns UUID columns lower-cased while the id enums are written
 * upper-case, so `advert.typeId === TypeIdEnum.X` is always false. Compare ids
 * through this, or let the database do the comparison.
 */
export const idEquals = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => !!a && !!b && a.toLowerCase() === b.toLowerCase()
