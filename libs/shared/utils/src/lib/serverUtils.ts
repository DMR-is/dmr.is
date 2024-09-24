import {
  BaseError,
  DatabaseError,
  Transaction,
  ValidationError,
} from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import {
  APPLICATION_FILES_BUCKET,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PRICE,
  FAST_TRACK_DAYS,
  ONE_MEGA_BYTE,
} from '@dmr.is/constants'
import { logger } from '@dmr.is/logging'
import {
  ApplicationCommitteeSignature,
  ApplicationSignature,
  CaseCommentTitleEnum,
  CaseCommentTypeEnum,
  CreateSignatureBody,
} from '@dmr.is/shared/dto'
import { Result, ResultWrapper } from '@dmr.is/types'

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

export const mapCommentTypeToTitle = (
  val: CaseCommentTypeEnum,
): CaseCommentTitleEnum => {
  switch (val) {
    case CaseCommentTypeEnum.Comment:
      return CaseCommentTitleEnum.Comment
    case CaseCommentTypeEnum.Message:
      return CaseCommentTitleEnum.Message
    case CaseCommentTypeEnum.Assign:
      return CaseCommentTitleEnum.Assign
    case CaseCommentTypeEnum.AssignSelf:
      return CaseCommentTitleEnum.AssignSelf
    case CaseCommentTypeEnum.Submit:
      return CaseCommentTitleEnum.Submit
    case CaseCommentTypeEnum.Update:
      return CaseCommentTitleEnum.UpdateStatus
  }
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

export const getApplicationBucket = () =>
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
  if (diffDays > FAST_TRACK_DAYS) {
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

export const withTransaction =
  <T>(sequelize: Sequelize) =>
  async (cb: (transaction: Transaction) => Promise<ResultWrapper<T>>) => {
    const transaction = await sequelize.transaction()

    try {
      const results = await cb(transaction)
      await transaction.commit()
      return results
    } catch (error) {
      await transaction.rollback()
      return handleException<T>({
        method: 'withTransaction',
        message: 'Error occurred during transaction',
        category: 'server',
        error,
      })
    }
  }

export const handleException = <T>({
  method,
  message,
  category,
  error,
  info,
  code = 500,
}: {
  method: string
  message: string
  category: string
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
    logger.debug(`Sequelize error ${error.name} in ${category}.${method}`, {
      method,
      category,
    })

    if (error instanceof DatabaseError) {
      logger.warn(
        `${error.name} in ${category}.${method}, reason: ${error.message}`,
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
    logger.warn(`${prefix} exception in ${category}.${method}`, {
      ...info,
      method,
      category,
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
    logger.error(`Error in ${category}.${method}: ${error.message}`, {
      ...info,
      method,
      category,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })

    return ResultWrapper.err({
      code: code,
      message: message,
    })
  }

  logger.error(`Unknown error in ${category}.${method}`, {
    error: error,
  })

  return ResultWrapper.err({
    code: code,
    message: message,
  })
}

/**
 * Filters out arguments that are instances of Transaction or Buffer
 * @param args arguments to filter
 * @returns
 */
export const filterArgs = (args: any[], service?: string, method?: string) => {
  const filteredArgs = args.filter((arg) => {
    const isTransaction = arg instanceof Transaction
    const isBuffer = Buffer.isBuffer(arg?.buffer) // filter out arguments with buffer / files

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
    const err = handleException<T>({
      method: 'withTryCatch',
      message,
      category: 'server',
      error,
    }).unwrap()

    return err
  }
}
