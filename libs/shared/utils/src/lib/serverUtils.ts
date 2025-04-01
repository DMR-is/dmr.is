import { isDefined, isUUID } from 'class-validator'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import sanitizeHtml from 'sanitize-html'
import { Op, Transaction } from 'sequelize'
import {
  APPLICATION_FILES_BUCKET,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  FAST_TRACK_DAYS,
  ONE_MEGA_BYTE,
  PAGING_MAXIMUM_PAGE_SIZE,
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
} from '@dmr.is/constants'
import { logger } from '@dmr.is/logging'

import { FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common'

export const MAX_CHARACTER_HTML = 1000

type GetLimitAndOffsetParams = {
  page?: number
  pageSize?: number
}
export const getLimitAndOffset = ({
  page = DEFAULT_PAGE_NUMBER,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetLimitAndOffsetParams) => {
  const pageToUse = page < 1 ? DEFAULT_PAGE_NUMBER : page

  const limit = pageSize
  const offset = (pageToUse - 1) * limit
  return {
    offset,
    limit,
  }
}

export function generatePaging(
  data: unknown[],
  page: number | undefined = 1,
  pageSize: number | undefined = DEFAULT_PAGE_SIZE,
  totalItems: number | undefined = data.length,
) {
  let pageToUse = page
  const totalPages =
    Math.ceil(totalItems / pageSize) === 0
      ? 1
      : Math.ceil(totalItems / pageSize)
  const nextPage = page + 1
  const previousPage = page - 1

  if (page > totalPages) {
    pageToUse = totalPages
  }

  return {
    page: Number(pageToUse),
    pageSize: Number(pageSize),
    totalPages,
    totalItems,
    nextPage: nextPage <= totalPages ? nextPage : null,
    previousPage: previousPage > 0 ? previousPage : null,
    hasNextPage: nextPage <= totalPages,
    hasPreviousPage: previousPage > 0,
  }
}

export function slicePagedData<T>(
  data: T[],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): T[] {
  return data.slice((page - 1) * pageSize, page * pageSize)
}

export const FILE_VALIDATORS = [
  new MaxFileSizeValidator({
    maxSize: ONE_MEGA_BYTE * 10,
    message: `File size exceeds the limit of 10MB.`,
  }),
  new FileTypeValidator({
    fileType: '.(png|jpeg|jpg)',
  }),
]

export const getS3Bucket = () =>
  process.env.AWS_APPLICATION_FILES_BUCKET ?? APPLICATION_FILES_BUCKET

/**
 * Creates the key for the application file
 * @param applicationId string
 * @param isOriginal boolean
 * @param fileName string
 * @param fileType string
 * @returns the key of the application file
 */
export const createApplicationKey = (
  applicationId: string,
  isOriginal: boolean,
  fileName: string,
  fileType: string,
) =>
  `applications/${applicationId}/${
    isOriginal ? 'frumrit' : 'fylgiskjol'
  }/${fileName}.${fileType}`

export const getKeyFromLocation = (location: string) => {
  const splitKey = 'applications/'
  return `${splitKey}${location.split(splitKey)[1]}`
}

export const getFastTrack = (date: Date) => {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const diffDays = diff / (1000 * 3600 * 24)
  let fastTrack = false

  if (diffDays <= FAST_TRACK_DAYS) {
    fastTrack = true
  }
  return {
    fastTrack,
    now,
  }
}

export const getHtmlTextLength = (str: string): number => {
  const sanitized = sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  })

  return sanitized.length
}

type EnumType = { [s: number]: string }

export const safeEnumMapper = <T extends EnumType>(
  val: unknown,
  enumType: T,
): T[keyof T] | null => {
  const found = Object.values(enumType).find((enumVal) => enumVal === val)

  return found ? (found as T[keyof T]) : null
}

export const enumMapper = <T extends EnumType>(
  val: unknown,
  enumType: T,
): T[keyof T] => {
  const found = Object.values(enumType).find((enumVal) => enumVal === val)

  if (found) {
    return found as T[keyof T]
  }

  throw new Error(`EnumMapper: ${val} not found in ${enumType}`)
}

/**
 * Filters out arguments that are instances of Transaction or Buffer
 * @param args arguments to filter
 * @returns
 */
export const filterArgs = (
  args: unknown[],
  service?: string,
  method?: string,
) => {
  const filteredArgs = args.filter((arg) => {
    const isTransaction = arg instanceof Transaction
    const isBuffer =
      typeof arg === 'object' &&
      isDefined(arg) &&
      'buffer' in arg &&
      Buffer.isBuffer(arg.buffer)

    if (Array.isArray(arg)) {
      const isTransactionOrBuffer = arg.filter((a) => {
        const isTransaction = a instanceof Transaction
        const isBuffer = Buffer.isBuffer(a?.buffer) // filter out arguments with buffer / files

        if (isBuffer && service && method) {
          logger.debug(
            `${service}.${String(method)}: received buffer as argument`,
          )
        }

        return !isTransaction && !isBuffer
      })

      return !isTransactionOrBuffer
    }

    return !isTransaction && !isBuffer
  })

  if (typeof args === 'object' && 'transaction' in args) {
    delete args.transaction
  }

  return filteredArgs
}

export const getPageSize = (pageSize: number | undefined): number => {
  if (!pageSize || pageSize <= 0) return DEFAULT_PAGE_SIZE

  if (pageSize > PAGING_MAXIMUM_PAGE_SIZE) {
    return PAGING_MAXIMUM_PAGE_SIZE
  }

  return pageSize
}

export const retryAsync = async <T>(
  asyncFn: () => Promise<T>,
  retries: number | undefined = PDF_RETRY_ATTEMPTS,
  delay: number | undefined = PDF_RETRY_DELAY,
): Promise<T> => {
  let attempt = 0

  while (attempt < retries) {
    try {
      return await asyncFn()
    } catch (error) {
      attempt++
      if (attempt >= retries) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error('Retry attempts exceeded')
}

/**
 *
 * @param department Ex. "A deild", "B deild", "C deild"
 * @param publicationDate iso string of the publication date
 * @returns
 */

export const getPublicationTemplate = (
  department: string,
  publicationDate: string | Date,
) => {
  const dateToUse =
    typeof publicationDate === 'string'
      ? new Date(publicationDate)
      : publicationDate

  const formatted = format(dateToUse, 'd. MMMM yyyy', {
    locale: is,
  })

  return `<p align="center" style="margin-top: 1.5em;"><strong>${department} - Útgáfud.: ${formatted}</strong></p>`
}

export const nextWeekdayAfterDays = (date: Date, minDays = 1) => {
  const result = new Date(date)
  result.setDate(date.getDate() + minDays)
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1)
  }
  return result
}

export const matchByIdTitleOrSlug = (filters?: string | string[]) => {
  const whereClause = {}

  if (!filters) {
    return whereClause
  }

  const isArray = Array.isArray(filters)
  const isId = isArray
    ? filters.every((filter) => isUUID(filter))
    : isUUID(filters)

  if (isId) {
    Object.assign(whereClause, {
      id: isArray ? { [Op.in]: filters } : { [Op.eq]: filters },
    })

    return whereClause
  }

  Object.assign(whereClause, {
    [Op.or]: [
      {
        title: isArray ? { [Op.in]: filters } : { [Op.eq]: filters },
      },
      {
        slug: isArray ? { [Op.in]: filters } : { [Op.eq]: filters },
      },
    ],
  })

  return whereClause
}
