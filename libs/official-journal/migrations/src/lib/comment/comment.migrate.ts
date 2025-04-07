import {
  CommentCreatorDto,
  CommentDto,
  CommentReceiverDto,
} from '@dmr.is/official-journal/dto/comment/comment.dto'
import { CaseActionEnum, CommentModel } from '@dmr.is/official-journal/models'

import { InternalServerErrorException } from '@nestjs/common'

import { caseStatusMigrate } from '../case-status/case-status.migrate'

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
      const involvedParty = model.userCreator?.involvedParties.find(
        (party) => party.id === involvedPartyId,
      )
      creator = {
        id: `${model.userCreatorId}`,
        title: `${model.userCreator?.firstName} ${model.userCreator?.lastName}${
          involvedParty ? ` (${involvedParty.title})` : ''
        }`,
      }
      break
    }
    case CaseActionEnum.UPDATE_STATUS:
    case CaseActionEnum.ASSIGN_USER:
    case CaseActionEnum.ASSIGN_SELF:
    case CaseActionEnum.COMMENT_EXTERNAL:
    case CaseActionEnum.COMMENT_INTERNAL: {
      creator = {
        id: `${model.userCreatorId}`,
        title: `${model.userCreator?.displayName}`,
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
    caseStatus: caseStatusMigrate(model.createdCaseStatus),
    action: model.caseAction.title,
    creator: creator,
    receiver: receiver,
    comment: model.comment,
  }
}
