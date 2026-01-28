import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../core/constants'
import { ICommentService } from '../comment.service.interface'
import {
  CreateStatusChangeCommentEvent,
  CreateSubmitCommentEvent,
  CreateUserAssignedCommentEvent,
} from '../events/create-submit-comment.event'

const LOGGING_CONTEXT = 'CommentListener'
@Injectable()
export class CommentListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICommentService) private readonly commentService: ICommentService,
  ) {}

  @OnEvent(LegalGazetteEvents.CREATE_SUBMIT_COMMENT)
  async handleAdvertCreatedEvent(payload: CreateSubmitCommentEvent) {
    if (payload.external) {
      if (!payload.actorId || !payload.actorName) {
        this.logger.error(
          'Missing actorId or actorName for external submit comment, skipping comment creation',
          {
            advertId: payload.advertId,
            context: LOGGING_CONTEXT,
          },
        )

        return
      }

      this.logger.info('Creating submit comment for external system', {
        advertId: payload.advertId,
        context: LOGGING_CONTEXT,
      })
      try {
        return await this.commentService.createSubmitCommentForExternalSystem(
          payload.advertId,
          payload.actorId,
          payload.actorName,
        )
      } catch (error) {
        this.logger.error(
          'Failed to create submit comment for external system',
          {
            advertId: payload.advertId,
            error,
            context: LOGGING_CONTEXT,
          },
        )
        return
      }
    }

    this.logger.info('Creating submit comment', {
      advertId: payload.advertId,
      context: LOGGING_CONTEXT,
    })
    await this.commentService.createSubmitComment(payload.advertId, {
      actorId: payload.actorId,
    })
  }

  @OnEvent(LegalGazetteEvents.STATUS_CHANGED)
  async handleStatusChangedEvent(payload: CreateStatusChangeCommentEvent) {
    this.logger.info('Handling status.changed event', {
      payload,
      context: LOGGING_CONTEXT,
    })

    await this.commentService.createStatusUpdateComment(payload.advertId, {
      actorId: payload.actorId,
      receiverId: payload.statusId,
    })
  }

  @OnEvent(LegalGazetteEvents.USER_ASSIGNED)
  async handleUserAssignedEvent(payload: CreateUserAssignedCommentEvent) {
    this.logger.info('Handling user.assigned event', {
      payload,
      context: LOGGING_CONTEXT,
    })
    await this.commentService.createAssignComment(payload.advertId, {
      actorId: payload.actorId,
      receiverId: payload.receiverId,
    })
  }

  @OnEvent(LegalGazetteEvents.CREATE_PUBLISH_COMMENT)
  async addPublicationComment(payload: { advertId: string; actorId?: string }) {
    this.logger.info('Creating publish comment', {
      payload,
      context: LOGGING_CONTEXT,
    })
    await this.commentService.createPublishComment(payload.advertId, {
      actorId: payload.actorId,
    })
  }
}
