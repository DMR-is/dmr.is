const IS_MONTHS = [
  'janúar',
  'febrúar',
  'mars',
  'apríl',
  'maí',
  'júní',
  'júlí',
  'ágúst',
  'september',
  'október',
  'nóvember',
  'desember',
]

export const formatDateIS = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  return `${day}. ${IS_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export enum ReportStatusTranslatedEnum {
  SUBMITTED = 'Innsending',
  DRAFT = 'Drög',
  IN_REVIEW = 'Í vinnslu',
  APPROVED = 'Afgreitt',
  DENIED = 'Hafnað',
  SUPERSEDED = 'Úrelt',
}
import { type ColumnDef } from '@tanstack/react-table'

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  jafnrettisaetlun: 'Jafnréttisáætlun',
  launagreining: 'Launagreining',
}

export const CATEGORY_LABEL_TO_SLUG: Record<string, string> =
  Object.fromEntries(
    Object.entries(CATEGORY_SLUG_MAP).map(([slug, label]) => [label, slug]),
  )

export type Case = {
  id: string
  date: string
  type: string
  company: string
  companyAdmin: string
  companyAdminGender: string
  kennitala: string
  status: string
  email: string
  isatCode: string
  reviewer: string
  employeeCount: string
}

export const COLUMNS: ColumnDef<Case>[] = [
  { accessorKey: 'date', header: 'Dagsetning', enableSorting: true },
  { accessorKey: 'type', header: 'Flokkur', enableSorting: true },
  { accessorKey: 'company', header: 'Fyrirtæki', enableSorting: true },
]

export const COLUMN_STATUS: ColumnDef<Case> = {
  accessorKey: 'status',
  header: 'Staða',
  enableSorting: true,
}

export const COLUMN_REVIEWER: ColumnDef<Case> = {
  accessorKey: 'reviewer',
  header: 'Starfsmaður',
  enableSorting: true,
}

export const DETAIL_FIELDS: Array<{ label: string; key: keyof Case }> = [
  { label: 'Fyrirtæki', key: 'company' },
  { label: 'Æðsti stjórnandi', key: 'companyAdmin' },
  { label: 'Kennitala', key: 'kennitala' },
  { label: 'Netfang', key: 'email' },
  { label: 'ÍSAT atvinnugreinaflokkun', key: 'isatCode' },
  { label: 'Kyn æðsta stjórnanda', key: 'companyAdminGender' },
  { label: 'Fjöldi starfsmanna', key: 'employeeCount' },
]
