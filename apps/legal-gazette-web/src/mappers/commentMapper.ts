import { getDaysAgo, getIcelandicDative } from '@dmr.is/utils/client'

import { CommentProps } from '../components/comments/Comment'
import { CommentDto, CommentTypeEnum } from '../gen/fetch'

export const commentMapper = (comment: CommentDto): CommentProps => {
  const cmt: CommentProps = {
    creator: comment.actor,
    createdAt: comment.createdAt,
    receiver: comment.receiver,
    message: comment.comment,
    action: '',
  }

  const createdDaysAgo = getDaysAgo(comment.createdAt)

  switch (createdDaysAgo) {
    case 0:
      cmt.createdAt = 'í dag'
      break
    case 1:
      cmt.createdAt = 'í gær'
      break
    default:
      cmt.createdAt = `f. ${createdDaysAgo} ${getIcelandicDative(createdDaysAgo)}`
      break
  }

  switch (comment.type) {
    case CommentTypeEnum.ASSIGN:
      cmt.action = 'skráir mál á: '
      break
    case CommentTypeEnum.COMMENT:
      cmt.action = 'gerir athugasemd.'
      cmt.icon = 'pencil'
      break
    case CommentTypeEnum.STATUSUPDATE:
      cmt.action = 'færir mál í stöðuna: '
      break
    case CommentTypeEnum.SUBMIT:
      cmt.actionFirst = true
      cmt.action = 'Innsent af: '
      break
  }

  return cmt
}
