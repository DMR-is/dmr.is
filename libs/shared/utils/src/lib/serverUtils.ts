import {
  APPLICATION_FILES_BUCKET,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PRICE,
  FAST_TRACK_DAYS,
  ONE_MEGA_BYTE,
} from '@dmr.is/constants'
import { CaseCommentTitle, CaseCommentType } from '@dmr.is/shared/dto'

import {
  BadRequestException,
  FileTypeValidator,
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
  val: CaseCommentType,
): CaseCommentTitle => {
  switch (val) {
    case CaseCommentType.Comment:
      return CaseCommentTitle.Comment
    case CaseCommentType.Message:
      return CaseCommentTitle.Message
    case CaseCommentType.Assign:
      return CaseCommentTitle.Assign
    case CaseCommentType.AssignSelf:
      return CaseCommentTitle.AssignSelf
    case CaseCommentType.Submit:
      return CaseCommentTitle.Submit
    case CaseCommentType.Update:
      return CaseCommentTitle.UpdateStatus
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
