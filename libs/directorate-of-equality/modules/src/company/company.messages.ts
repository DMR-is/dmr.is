/**
 * Error messages for the company module.
 *
 * Each entry pairs a developer-facing English `message` (kept in logs and the
 * error `details[]`) with a user-facing, localized `translatedMessage` that the
 * HTTP exception filter forwards to the client for direct display.
 *
 * Pass an entry straight to a Nest HTTP exception or to a `*OrThrow` helper:
 *
 *   throw new NotFoundException(companyMessages.notFound(id))
 *   await company.findOneOrThrow({ where: { id } }, companyMessages.notFound(id))
 *
 * Static entries are objects; entries that interpolate context are factory
 * functions returning the same shape. Add `translatedMessage` only for errors
 * that are expected and actionable for the end user — everything else falls
 * back to the generic message produced by the filter.
 */
export type ErrorMessage = {
  message: string
  translatedMessage: string
}

export const companyMessages = {
  notFound: (id: string): ErrorMessage => ({
    message: `Company "${id}" not found`,
    translatedMessage: 'Fyrirtækið fannst ekki',
  }),
  notFoundByNationalId: (nationalId: string): ErrorMessage => ({
    message: `Company with national id "${nationalId}" not found`,
    translatedMessage: 'Fyrirtækið fannst ekki',
  }),
  alreadyExists: (nationalId: string): ErrorMessage => ({
    message: `Company with national id "${nationalId}" already exists`,
    translatedMessage: 'Fyrirtæki með þessa kennitölu er þegar til',
  }),
  registryEntityNotFound: (nationalId: string): ErrorMessage => ({
    message: `No entity found in national registry for "${nationalId}"`,
    translatedMessage: 'Engin skráning fannst í þjóðskrá fyrir þessa kennitölu',
  }),
  registryEntityNotFoundNoFallback: (nationalId: string): ErrorMessage => ({
    message: `No entity found in national registry for "${nationalId}" and no fallback name provided`,
    translatedMessage: 'Engin skráning fannst í þjóðskrá fyrir þessa kennitölu',
  }),
  // The kennitala is named in the translated text too: a subsidiary list can
  // hold several, and the applicant needs to know which one to correct.
  invalidKennitala: (nationalId: string): ErrorMessage => ({
    message: `Kennitala "${nationalId}" fails its checksum`,
    translatedMessage: `Kennitalan ${nationalId} er ekki gild. Athugaðu hvort um innsláttarvillu sé að ræða.`,
  }),
  notALegalEntity: (nationalId: string): ErrorMessage => ({
    message: `Kennitala "${nationalId}" does not belong to a legal entity`,
    translatedMessage: `Kennitalan ${nationalId} er ekki kennitala lögaðila.`,
  }),
  inactiveCannotCreate: (nationalId: string): ErrorMessage => ({
    message: `Company with national id "${nationalId}" is not active in the RSK company registry and cannot be created`,
    translatedMessage: 'Ekki er hægt að skrá fyrirtæki sem er ekki virkt',
  }),
} as const
