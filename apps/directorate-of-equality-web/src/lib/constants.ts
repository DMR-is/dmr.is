export const NAV_PATHS = {
  frontpage: { title: 'Forsíða', href: '/' },
  heildarlisti: { title: 'Heildarlisti', href: '/yfirlit' },
  jafnrettisaetlanir: {
    title: 'Jafnréttisáætlanir',
    href: 'yfirlit?type=EQUALITY',
  },
  urbotaaetlanir: {
    title: 'Úrbótaáætlanir',
    href: '/yfirlit?hasImprovementPlan=true',
  },
  skyrslur: { title: 'Skýrslur', href: '/yfirlit?type=SALARY' },
  fyrirtaeki: { title: 'Fyrirtæki', href: '/fyrirtaeki' },
  ritstjorn: { title: 'Ritstjórar', href: '/ritstjorar' },
}

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
  POSTPONED = 'Frestað',
  DRAFT = 'Drög',
  IN_REVIEW = 'Í vinnslu',
  APPROVED = 'Afgreitt',
  DENIED = 'Hafnað',
  SUPERSEDED = 'Úrelt',
  WITHDRAWN = 'Dregin til baka',
}
import { overviewText, reportText, sharedText } from './text'

import { type ColumnDef } from '@tanstack/react-table'

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
  {
    accessorKey: 'date',
    header: overviewText.filter.dateLabel,
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: overviewText.filter.typeLabel,
    enableSorting: true,
  },
  {
    accessorKey: 'company',
    header: overviewText.filter.companyLabel,
    enableSorting: true,
  },
]

export const COLUMN_STATUS: ColumnDef<Case> = {
  accessorKey: 'status',
  header: sharedText.statusLabel,
  enableSorting: true,
}

export const COLUMN_REVIEWER: ColumnDef<Case> = {
  accessorKey: 'reviewer',
  header: overviewText.filter.reviewerLabel,
  enableSorting: true,
}

export const DETAIL_FIELDS: Array<{ label: string; key: keyof Case }> = [
  { label: sharedText.form.companyHeading, key: 'company' },
  { label: sharedText.form.topManagerHeading, key: 'companyAdmin' },
  { label: sharedText.form.kennitalaLabel, key: 'kennitala' },
  { label: sharedText.form.emailLabel, key: 'email' },
  { label: reportText.detailFields.isatCode, key: 'isatCode' },
  {
    label: reportText.detailFields.companyAdminGender,
    key: 'companyAdminGender',
  },
  { label: reportText.detailFields.employeeCount, key: 'employeeCount' },
]
