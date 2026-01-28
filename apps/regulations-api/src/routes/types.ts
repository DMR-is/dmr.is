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
  date?: ISODate
  currentTitle: string // textSource.title,
  currentText: string // textSource.text as HTMLText,
}

export * from '@dmr.is/regulations-tools/types'
