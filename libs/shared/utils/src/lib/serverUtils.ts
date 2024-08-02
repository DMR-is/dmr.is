import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { CaseCommentTitle, CaseCommentType } from '@dmr.is/shared/dto'

import { BadRequestException } from '@nestjs/common'

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
