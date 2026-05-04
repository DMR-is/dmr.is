import { type ColumnDef } from '@tanstack/react-table'

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  jafnrettisaetlun: 'Jafnréttisáætlun',
  urbotaaaetlun: 'Úrbótaáætlun',
}

export const CATEGORY_LABEL_TO_SLUG: Record<string, string> =
  Object.fromEntries(
    Object.entries(CATEGORY_SLUG_MAP).map(([slug, label]) => [label, slug]),
  )

export type Case = {
  date: string
  category: string
  company: string
  ceo: string
  kennitala: string
  email: string
  isat: string
  ceoGender: string
  employees: number
  status?: string
}

export const COLUMNS: ColumnDef<Case>[] = [
  { accessorKey: 'date', header: 'Dagsetning', enableSorting: true },
  { accessorKey: 'category', header: 'Flokkur', enableSorting: true },
  { accessorKey: 'company', header: 'Fyrirtæki', enableSorting: true },
]

export const COLUMN_STATUS: ColumnDef<Case> = {
  accessorKey: 'status',
  header: 'Staða',
  enableSorting: true,
}

export const COLUMN_EMPLOYEES: ColumnDef<Case> = {
  accessorKey: 'employees',
  header: 'Starfsmenn',
  enableSorting: true,
}

export const DETAIL_FIELDS: Array<{ label: string; key: keyof Case }> = [
  { label: 'Fyrirtæki', key: 'company' },
  { label: 'Æðsti stjórnandi', key: 'ceo' },
  { label: 'Kennitala', key: 'kennitala' },
  { label: 'Netfang', key: 'email' },
  { label: 'ÍSAT atvinnugreinaflokkun', key: 'isat' },
  { label: 'Kyn æðsta stjórnanda', key: 'ceoGender' },
  { label: 'Fjöldi starfsmanna', key: 'employees' },
]
