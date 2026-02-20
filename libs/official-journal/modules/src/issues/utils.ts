import endOfDay from 'date-fns/endOfDay'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import startOfDay from 'date-fns/startOfDay'

import { DEPARTMENT_IDS } from './constants'

export const getStartOfCurrentMonth = (date: Date): Date => {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1))
}

export const getEndOfCurrentMonth = (date: Date): Date => {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export const getCurrentMonthDateRange = (date: Date): [Date, Date] => {
  return [getStartOfCurrentMonth(date), getEndOfCurrentMonth(date)]
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
      throw new Error(`Unknown department ID: ${departmentId}`)
  }
}

