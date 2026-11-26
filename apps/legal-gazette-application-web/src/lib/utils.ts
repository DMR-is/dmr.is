import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { ApplicationTypeEnum } from '@dmr.is/legal-gazette-schemas'

import { DateFormats, FormTypes } from './constants'

export const mapFormTypeToApplicationType = (
  formType: FormTypes,
): ApplicationTypeEnum => {
  switch (formType) {
    case FormTypes.BANKRUPTCY:
      return ApplicationTypeEnum.RECALL_BANKRUPTCY
    case FormTypes.DECEASED:
      return ApplicationTypeEnum.RECALL_DECEASED
    case FormTypes.COMMON:
      return ApplicationTypeEnum.COMMON
  }
}

export const formatDate = (
  date: string | Date,
  df: DateFormats = DateFormats.LONG,
): string => {
  const dateToUse = typeof date === 'string' ? new Date(date) : date

  return format(dateToUse, df, { locale: is })
}

export const isWeekday = (date: Date): boolean => {
  const day = date.getDay()
  return day !== 0 && day !== 6 // 0 is Sunday, 6 is Saturday
}
