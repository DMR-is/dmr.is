import { InternalServerErrorException } from '@nestjs/common'

import { CaseActionEnum } from '@dmr.is/shared/dto'
import {
  CommentCreatorDto,
  CommentDto,
  CommentReceiverDto,
} from '@dmr.is/shared/dto'

import { CommentModel } from '../models/comment.model'

export const commentMigrate = (
  model: CommentModel,
  involvedPartyId?: string,
): CommentDto => {
  let creator: CommentCreatorDto | null = null
  let receiver: CommentReceiverDto | null = null

  switch (model.caseAction.title) {
    case CaseActionEnum.SUBMIT: {
      // advert involved party
      creator = {
        id: `${model.institutionCreatorId}`,
        title: `${model.institutionCreator?.title}`,
      }
      break
    }
    case CaseActionEnum.COMMENT_APPLICATION: {
      const involvedParty = model.userCreator?.involvedParties.find(
        (party) => party.id === involvedPartyId,
      )
      if (model.userCreatorId) {
        creator = {
          id: `${model.userCreatorId}`,
          title: `${model.userCreator?.firstName} ${model.userCreator?.lastName}${
            involvedParty ? ` (${involvedParty.title})` : ''
          }`,
        }
      } else {
        creator = {
          id: '',
          title: `${model.applicationUserName ?? ''}${
            involvedParty ? ` (${involvedParty.title})` : ''
          }`,
        }
      }
      break
    }
    case CaseActionEnum.UPDATE_STATUS:
    case CaseActionEnum.ASSIGN_USER:
    case CaseActionEnum.ASSIGN_SELF:
    case CaseActionEnum.COMMENT_EXTERNAL:
    case CaseActionEnum.COMMENT_INTERNAL: {
      if (model.userCreatorId) {
        creator = {
          id: `${model.userCreatorId}`,
          title: `${model.userCreator?.displayName}`,
        }
      } else {
        const involvedParty = model.userCreator?.involvedParties.find(
          (party) => party.id === involvedPartyId,
        )
        creator = {
          id: '',
          title: `${model.applicationUserName ?? ''}${
            involvedParty ? ` (${involvedParty.title})` : ''
          }`,
        }
      }
      break
    }
  }

  switch (model.caseAction.title) {
    case CaseActionEnum.UPDATE_STATUS: {
      receiver = {
        id: `${model.caseStatusReceiverId}`,
        title: `${model.caseStatusReceiver?.title}`,
      }

      break
    }
    case CaseActionEnum.ASSIGN_USER: {
      receiver = {
        id: `${model.userReceiverId}`,
        title: `${model.userReceiver?.displayName}`,
      }
      break
    }
  }

  if (creator === null) {
    throw new InternalServerErrorException()
  }

  return {
    id: model.id,
    created: model.created,
    caseStatus: model.createdCaseStatus,
    action: model.caseAction.title,
    creator: creator,
    receiver: receiver,
    comment: model.comment,
  }
}
