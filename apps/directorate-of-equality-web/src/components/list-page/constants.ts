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
  identifier: string | null
  date: string
  type: string
  company: string
  kennitala: string
  status: string
  reviewer: string
  correctionDeadline: string | null
  validUntil: string | null
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

export const DETAIL_FIELDS: Array<{ label: string; key: keyof Case }> = [
  { label: 'Fyrirtæki', key: 'company' },
  { label: 'Kennitala', key: 'kennitala' },
  { label: 'Málsnúmer', key: 'identifier' },
  { label: 'Umsjónarmaður', key: 'reviewer' },
  { label: 'Leiðréttingarfrestur', key: 'correctionDeadline' },
  { label: 'Gildir til', key: 'validUntil' },
]
