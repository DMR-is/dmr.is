import {
  formatDate,
  getDaysAgo,
  getIcelandicDative,
} from '@dmr.is/utils/client'

import { CommentProps } from '../components/comments/Comment'
import { CommentDto, CommentTypeEnum } from '../gen/fetch'

export const commentMapper = (comment: CommentDto): CommentProps => {
  const cmt: CommentProps = {
    creator: comment.actor,
    createdAt: comment.createdAt,
    receiver: comment.receiver,
    message: comment.comment,
    action: '',
    iconType: 'filled',
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
    case CommentTypeEnum.PUBLISH:
      cmt.action = `gaf út birtingu: `
      cmt.receiver = `kl. ${formatDate(comment.createdAt, 'HH:mm')}`
      cmt.icon = 'checkmarkCircle'
      cmt.iconType = 'outline'
      break
  }

  return cmt
}

export const commentStepperMapper = (comment: CommentDto) => {
  switch (comment.type) {
    case CommentTypeEnum.SUBMIT:
      return {
        title: `Auglýsing stofnuð af ${comment.actor}`,
        date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
      }
    case CommentTypeEnum.ASSIGN:
      if (comment.actor === comment.receiver) {
        return {
          title: `${comment.actor} merkir sér auglýsinguna`,
          date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
        }
      }

      return {
        title: `${comment.actor} færir mál á ${comment.receiver}`,
        date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
      }
    case CommentTypeEnum.STATUSUPDATE:
      return {
        title: `Fært í stöðuna : ${comment.status.title}`,
        date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
      }
    case CommentTypeEnum.COMMENT:
      return {
        title: `${comment.actor} bætti við athugasemd`,
        date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
      }
    case CommentTypeEnum.PUBLISH:
      return {
        title: `${comment.actor} gaf út birtingu`,
        date: formatDate(comment.createdAt, 'dd. MMMM yyyy'),
      }
    default:
      return null
  }
}
