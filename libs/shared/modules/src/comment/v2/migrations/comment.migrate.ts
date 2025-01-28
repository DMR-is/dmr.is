import { CaseActionEnum } from '@dmr.is/shared/dto'

import { InternalServerErrorException } from '@nestjs/common'

import {
  CommentCreatorDto,
  CommentDto,
  CommentReceiverDto,
} from '../dto/comment.dto'
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
      // application user
      const involvedParty = model.applicationUserCreator?.involvedParties.find(
        (party) => party.id === involvedPartyId,
      )
      creator = {
        id: `${model.applicationUserCreatorId}`,
        title: `${model.applicationUserCreator?.firstName} ${
          model.applicationUserCreator?.lastName
        }${involvedParty ? ` (${involvedParty.title})` : ''}`,
      }
      break
    }
    case CaseActionEnum.UPDATE_STATUS:
    case CaseActionEnum.ASSIGN_USER:
    case CaseActionEnum.ASSIGN_SELF:
    case CaseActionEnum.COMMENT_EXTERNAL:
    case CaseActionEnum.COMMENT_INTERNAL: {
      creator = {
        id: `${model.adminUserCreatorId}`,
        title: `${model.adminUserCreator?.displayName}`,
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
        id: `${model.adminUserReceiverId}`,
        title: `${model.adminUserReceiver?.displayName}`,
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
    status: model.createdCaseStatus,
    action: model.caseAction.title,
    creator: creator,
    receiver: receiver,
    comment: model.comment,
  }
}
