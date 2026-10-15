import type {
  ISODate,
  Ministry,
  RegName,
  Year,
} from '@dmr.is/regulations-tools/types'

// ---------------------------------------------------------------------------

// Years
export type RegulationYears = Array<Year>

// ---------------------------------------------------------------------------

// Regulations list
export type RegulationListItem = {
  /** Publication name */
  name: RegName
  /** The title of the Regulation */
  title: string
  /** The ministry that the regulation is linked to */
  ministry?: Ministry
  /** Publication date of this regulation */
  publishedDate: ISODate
}

export type RegulationSearchResults = {
  /** The number of the current page, 1-based  */
  page: number
  /** Total number of pages available for this query */
  perPage: number
  /** Total number of pages available for this query */
  totalPages: number
  /** Total number of items found for this query */
  totalItems: number
  /** ReguationListItems for this page */
  data: Array<RegulationListItem>
}

// ---------------------------------------------------------------------------

export type CurrentRegulationChange = {
  /** Date of the change itself */
  date?: ISODate
  /** Title in force just before the change */
  currentTitle: string
  /** Text in force just before the change */
  currentText: string
  /** `regulationchange` id the text comes from; `null` for the original text */
  sourceChangeId: number | null
  /** Name of the regulation that made that change; `null` for the original text */
  sourceChangingName: RegName | null
  /** Date of that `regulationchange` row; absent for the original text */
  sourceDate?: ISODate
  /** Earlier changes without text, so missing from `currentText`. Newest first */
  skippedChanges: Array<SkippedRegulationChange>
}

export type SkippedRegulationChange = {
  /** `regulationchange` id */
  id: number
  /** Id of the regulation that made the change */
  changingId: number
  /** Name of the regulation that made the change */
  changingName: RegName
  date: ISODate
}

export * from '@dmr.is/regulations-tools/types'
