import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { ApiErrorDto, ApiErrorDtoFromJSON } from '../gen/fetch'
type SafeCallReturn<T> =
  | {
      data: T
      error: null
    }
  | {
      data: null
      error: ApiErrorDto
    }

export async function safeCall<T>(
  call: () => Promise<T>,
): Promise<SafeCallReturn<T>> {
  try {
    const data = await call()

    return {
      data,
      error: null,
    }
  } catch (error) {
    const response = error as unknown as Response
    const json = await response.json()
    const errorDto = ApiErrorDtoFromJSON(json)

    return {
      data: null,
      error: errorDto,
    }
  }
}

export const formatDate = (date: string | Date): string => {
  const dateToUse = new Date(date)

  return format(dateToUse, 'dd. MMMM yyyy', {
    locale: is,
  })
}

export const isDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}
