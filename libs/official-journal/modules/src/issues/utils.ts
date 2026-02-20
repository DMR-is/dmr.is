import endOfDay from 'date-fns/endOfDay'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import startOfDay from 'date-fns/startOfDay'

import { DEPARTMENT_IDS } from './constants'
export const getStartOfLastMonth = (date: Date): Date => {
  return startOfDay(new Date(date.getFullYear(), date.getMonth() - 1, 1))
}

export const getEndOfLastMonth = (date: Date): Date => {
  return endOfDay(new Date(date.getFullYear(), date.getMonth(), 0))
}

export const getDateRange = (date: Date): [Date, Date] => {
  return [getStartOfLastMonth(date), getEndOfLastMonth(date)]
}

export const getMonthName = (date: Date): string => {
  return format(date, 'LLLL', { locale: is })
}

export const mapDepartmentIdToTitle = (departmentId: string): string => {
  switch (departmentId) {
    case DEPARTMENT_IDS[0]:
      return 'A deild'
    case DEPARTMENT_IDS[1]:
      return 'B deild'
    case DEPARTMENT_IDS[2]:
      return 'C deild'
    default:
      return 'Óþekkt deild'
  }
}

