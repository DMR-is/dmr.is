import { REPORT_VALIDITY_YEARS } from '../constants'
import { ReportTypeEnum } from '../report/models/report.enums'

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
  subsidiaryNotInRegistry: (nationalId: string): ErrorMessage => ({
    message: `Subsidiary "${nationalId}" is not in the national registry — check the kennitala`,
    translatedMessage: `Dótturfélag með kennitöluna ${nationalId} fannst ekki í þjóðskrá`,
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
  unknownSnapshotIsatCategory: (value: string): ErrorMessage => ({
    message: `company.isatCategory "${value}" does not lead with an ÍSAT2008 code`,
    translatedMessage: `ÍSAT-flokkurinn „${value}“ er ekki til`,
  }),
  unknownSnapshotPostcode: (value: string): ErrorMessage => ({
    message: `company.postcode "${value}" does not lead with a known Icelandic postcode`,
    translatedMessage: `Póstnúmerið „${value}“ er ekki til`,
  }),
  invalidDueDate: (value: string): ErrorMessage => ({
    message: `dueDate "${value}" is not a real calendar day`,
    translatedMessage: `Dagsetningin „${value}“ er ekki gild`,
  }),
  dueDateBeforeCurrent: (value: string, current: string): ErrorMessage => ({
    message: `dueDate "${value}" is before the current due date "${current}"`,
    translatedMessage: 'Ekki er hægt að færa skiladag aftur í tímann',
  }),
  reportNotOwed: (id: string, reportType: ReportTypeEnum): ErrorMessage => ({
    message: `company ${id} owes no ${reportType} report, so it has no ${reportType} due date`,
    translatedMessage:
      reportType === ReportTypeEnum.SALARY
        ? 'Fyrirtækinu ber ekki að skila skýrslu'
        : 'Fyrirtækinu ber ekki að skila jafnréttisáætlun',
  }),
  dueDateTooFar: (value: string, latest: string): ErrorMessage => ({
    message: `dueDate "${value}" is after the latest allowed day "${latest}"`,
    translatedMessage: `Skiladagur má ekki vera meira en ${REPORT_VALIDITY_YEARS} ár fram í tímann`,
  }),
  dueDateInPast: (value: string): ErrorMessage => ({
    message: `dueDate "${value}" is in the past`,
    translatedMessage: 'Skiladagur getur ekki verið liðinn',
  }),
} as const
