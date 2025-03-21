import { isDefined } from 'class-validator'
import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import sanitizeHtml from 'sanitize-html'
import {
  BaseError,
  DatabaseError,
  Transaction,
  ValidationError,
} from 'sequelize'
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
import {
  AdvertTemplateDetails,
  AdvertTemplateTypeEnums,
  ApplicationSignatureMember,
  ApplicationSignatureRecord,
  CaseCommentDirectionEnum,
  CaseCommentSourceEnum,
  CaseStatusEnum,
  GetAdvertTemplateResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  FileTypeValidator,
  HttpException,
  MaxFileSizeValidator,
} from '@nestjs/common'

import {
  templateAuglysing,
  templateGjaldskra,
  templateReglugerd,
} from './constants'

export const MAX_CHARACTERS_BASE_APPLICATION = 1000

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

export const getNextStatus = (status: CaseStatusEnum): CaseStatusEnum => {
  switch (status) {
    case CaseStatusEnum.Submitted:
      return CaseStatusEnum.InProgress
    case CaseStatusEnum.InProgress:
      return CaseStatusEnum.InReview
    case CaseStatusEnum.InReview:
      return CaseStatusEnum.ReadyForPublishing
  }

  return status
}

export const getPreviousStatus = (status: CaseStatusEnum): CaseStatusEnum => {
  switch (status) {
    case CaseStatusEnum.InProgress:
      return CaseStatusEnum.Submitted
    case CaseStatusEnum.InReview:
      return CaseStatusEnum.InProgress
    case CaseStatusEnum.ReadyForPublishing:
      return CaseStatusEnum.InReview
  }

  return status
}

export const handleException = <T>({
  method,
  service,
  error,
  info,
  code = 500,
}: {
  method: string
  service: string
  error: unknown
  info?: Record<string, unknown>
  code?: number
}): ResultWrapper<T> => {
  let prefix = 'Error occurred'

  switch (code) {
    case 400:
      prefix = 'Bad request'
      break
    case 404:
      prefix = 'Not found'
      break
    case 405:
      prefix = 'Method not allowed'
      break
    default:
      prefix = 'Internal server error'
  }

  if (error instanceof BaseError) {
    logger.debug(`Sequelize error ${error.name} in ${service}.${method}`, {
      method,
      category: service,
    })

    if (error instanceof DatabaseError) {
      logger.warn(
        `${error.name} in ${service}.${method}, reason: ${error.message}`,
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Internal server error',
      })
    }

    if (error instanceof ValidationError) {
      error.errors.forEach((err) => {
        logger.debug(
          `Validation failed for ${err.path}: received ${err.value}. Reason: ${err.message}`,
        )
      })

      return ResultWrapper.err({
        code: 400,
        message: 'Validation failed',
      })
    }
  }

  if (error instanceof HttpException) {
    logger.warn(`${prefix} exception in ${service}.${method}`, {
      ...info,
      method,
      category: service,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: error.getStatus(),
      message: error.message,
    })
  }

  if (error instanceof Error) {
    logger.error(`Error in ${service}.${method}: ${error.message}`, {
      ...info,
      method,
      category: service,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: code,
      message: error.message,
    })
  }

  logger.error(`Unknown error in ${service}.${method}`, {
    category: service,
    error: error,
  })

  return ResultWrapper.err({
    code: code,
    message: 'Internal server error',
  })
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

export const withTryCatch = <T>(cb: () => T, message: string): T => {
  try {
    return cb()
  } catch (error) {
    return handleException<T>({
      method: 'withTryCatch',
      service: 'server',
      error,
    }).unwrap()
  }
}

export const mapSourceToDirection = (
  source: CaseCommentSourceEnum,
  forSource: CaseCommentSourceEnum,
): CaseCommentDirectionEnum => {
  return source === forSource
    ? CaseCommentDirectionEnum.Sent
    : CaseCommentDirectionEnum.Received
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

export const getTemplate = (
  type: AdvertTemplateTypeEnums,
): GetAdvertTemplateResponse => {
  const DEFAULT = {
    html: templateAuglysing,
    type: AdvertTemplateTypeEnums.AUGLYSING,
  }

  const templateType = type.toLowerCase()

  switch (templateType) {
    case AdvertTemplateTypeEnums.AUGLYSING:
      return DEFAULT
    case AdvertTemplateTypeEnums.REGLUGERD:
      return {
        html: templateReglugerd,
        type: AdvertTemplateTypeEnums.REGLUGERD,
      }
    case AdvertTemplateTypeEnums.GJALDSKRA:
      return {
        html: templateGjaldskra,
        type: AdvertTemplateTypeEnums.GJALDSKRA,
      }
    default:
      return DEFAULT
  }
}

export const getTemplateDetails = (): AdvertTemplateDetails[] => {
  const enumArray = Object.values<AdvertTemplateTypeEnums>(
    AdvertTemplateTypeEnums,
  )
  const res = enumArray.map((slug) => {
    switch (slug) {
      case AdvertTemplateTypeEnums.AUGLYSING:
        return {
          slug: AdvertTemplateTypeEnums.AUGLYSING,
          title: 'Auglýsing',
        }
      case AdvertTemplateTypeEnums.REGLUGERD:
        return {
          slug: AdvertTemplateTypeEnums.REGLUGERD,
          title: 'Reglugerð',
        }
      case AdvertTemplateTypeEnums.GJALDSKRA:
        return {
          slug: AdvertTemplateTypeEnums.GJALDSKRA,
          title: 'Gjaldskrá',
        }
    }
  })

  return res
}

const memberTemplate = (member: ApplicationSignatureMember) => {
  const styleObject = {
    marginBottom: member?.below ? '0' : '1.5em',
  }

  const name = member?.name ?? ''
  const above = member?.above ?? ''
  const after = member?.after ?? ''
  const below = member?.below ?? ''

  const aboveMarkup = above
    ? `<p style="margin-bottom: 0;" align="center">${above}</p>`
    : ''
  const afterMarkup = after ? ` ${after}` : ''
  const belowMarkup = below ? `<p align="center">${below}</p>` : ''

  return `
    <div class="signature__member">
      ${aboveMarkup}
      <p style="margin-bottom: ${styleObject.marginBottom}" align="center"><strong>${name}</strong>${afterMarkup}</p>
      ${belowMarkup}
    </div>
  `
}

const signatureRecordTemplate = (record: ApplicationSignatureRecord) => {
  const membersCount = record.members?.length ?? 0

  const styleObject = {
    display: membersCount > 1 ? 'grid' : 'block',
    gridTemplateColumns:
      membersCount === 1
        ? '1fr'
        : membersCount === 3
        ? '1fr 1fr 1fr'
        : '1fr 1fr',
    rowGap: '1.5em',
  }

  const formattedDate = record.signatureDate
    ? format(new Date(record.signatureDate), 'd. MMMM yyyy.', {
        locale: is,
      })
    : ''

  const chairmanMarkup = record.chairman
    ? `<div style="margin-bottom: 1.5em;">${memberTemplate(
        record.chairman,
      )}</div>`
    : ''

  const membersMarkup =
    record.members?.map((member) => memberTemplate(member)).join('') ?? ''

  return `
      <div class="signature" style="margin-bottom: 3em;">
        <p align="center"><em>${
          record.institution.endsWith(',')
            ? record.institution
            : record.institution + ','
        } <span class="signature__date">${formattedDate}</span></em></p>
        ${chairmanMarkup}
        <div style="display: ${styleObject.display}; grid-template-columns: ${
    styleObject.gridTemplateColumns
  }; row-gap: ${styleObject.rowGap};" class="signature__content">
        ${membersMarkup}
        </div>
      </div>`
}

const filteredRecords = (records: ApplicationSignatureRecord[]) => {
  if (records.length === 1) {
    return records
  }

  // Filter out records that are not the latest
  const latestDate = records
    .map((item) => item.signatureDate)
    .filter(Boolean)
    .reduce((max, date) => (date > max ? date : max), '')

  return records.map((item) => ({
    ...item,
    signatureDate: item.signatureDate === latestDate ? latestDate : '',
  }))
}

export const applicationSignatureTemplate = (
  records?: ApplicationSignatureRecord[],
) => {
  if (!records) {
    return ''
  }
  const sortedRecords = filteredRecords(records)

  const recordsMarkup =
    sortedRecords?.map((record) => signatureRecordTemplate(record)).join('') ??
    ''

  return recordsMarkup
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
