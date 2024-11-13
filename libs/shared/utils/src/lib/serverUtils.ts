import { isDefined } from 'class-validator'
import {
  BaseError,
  DatabaseError,
  Transaction,
  ValidationError,
} from 'sequelize'
import {
  APPLICATION_FILES_BUCKET,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PRICE,
  FAST_TRACK_DAYS,
  ONE_MEGA_BYTE,
  PAGING_MAXIMUM_PAGE_SIZE,
  PDF_RETRY_ATTEMPTS,
  PDF_RETRY_DELAY,
} from '@dmr.is/constants'
import { logger } from '@dmr.is/logging'
import {
  ApplicationCommitteeSignature,
  ApplicationSignature,
  CaseCommentDirectionEnum,
  CaseCommentSourceEnum,
  CaseStatusEnum,
  CreateSignatureBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  BadRequestException,
  FileTypeValidator,
  HttpException,
  MaxFileSizeValidator,
} from '@nestjs/common'

export function generatePaging(
  data: unknown[],
  page: number | undefined = 1,
  pageSize: number | undefined = DEFAULT_PAGE_SIZE,
  totalItems: number | undefined = data.length,
) {
  const totalPages =
    Math.ceil(totalItems / pageSize) === 0
      ? 1
      : Math.ceil(totalItems / pageSize)
  const nextPage = page + 1
  const previousPage = page - 1

  if (page > totalPages) {
    throw new BadRequestException(
      `Invalid page<${page}> number is larger than totalPages<${totalPages}>`,
    )
  }

  return {
    page: Number(page),
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

/**
 * Calculates the price for the application
 * For now we dont know how to calculate the price
 * so we will return default price
 */
export const calculatePriceForApplication = () => DEFAULT_PRICE

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

export const getSignatureBody = (
  caseId: string,
  signature: ApplicationSignature | ApplicationCommitteeSignature,
  additionalSignature?: string,
): CreateSignatureBody => {
  const hasChairman = 'chairman' in signature

  return {
    caseId: caseId,
    date: signature.date,
    institution: signature.institution,
    involvedPartyId: 'e5a35cf9-dc87-4da7-85a2-06eb5d43812f', // TODO: add auth set to dómsmálaráðuneytið
    members: signature.members.map((member) => ({
      text: member.name,
      textAbove: member.above,
      textAfter: member.after,
      textBefore: member.before,
      textBelow: member.below,
    })),
    additionalSignature: additionalSignature,
    html: signature.html,
    chairman: hasChairman
      ? {
          text: signature.chairman.name,
          textAbove: signature.chairman.above,
          textAfter: signature.chairman.after,
          textBefore: signature.chairman.before,
          textBelow: signature.chairman.below,
        }
      : undefined,
  }
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

export const convertDateToDaysAgo = (dateIso: string): string => {
  try {
    const date = new Date(dateIso)

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffDays = Math.floor(diff / (1000 * 3600 * 24))

    if (diffDays === 0) {
      return 'Í dag'
    }

    if (diffDays === 1) {
      return 'í gær'
    }

    return `f. ${diffDays} dögum`
  } catch (error) {
    logger.error(`Error converting date to days ago`, {
      category: 'server',
      method: 'convertDateToDaysAgo',
      error: error,
    })

    return 'Ekki vitað'
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
