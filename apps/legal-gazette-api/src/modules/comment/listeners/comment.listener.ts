import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../core/constants'
import { ICommentService } from '../comment.service.interface'
import {
  CreateStatusChangeCommentEvent,
  CreateSubmitCommentEvent,
} from '../events/create-submit-comment.event'

@Injectable()
export class CommentListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICommentService) private readonly commentService: ICommentService,
  ) {}

  @OnEvent(LegalGazetteEvents.ADVERT_CREATED)
  async handleAdvertCreatedEvent(payload: CreateSubmitCommentEvent) {
    if (payload.external) {
      if (!payload.actorId || !payload.actorName) {
        this.logger.error(
          'Missing actorId or actorName for external submit comment, skipping comment creation',
          {
            advertId: payload.advertId,
            context: 'CommentListener',
          },
        )

        return
      }

      this.logger.info('Creating submit comment for external system', {
        advertId: payload.advertId,
        context: 'CommentListener',
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
            context: 'CommentListener',
          },
        )
        return
      }
    }

    this.logger.info('Creating submit comment', {
      advertId: payload.advertId,
      context: 'CommentListener',
    })
    await this.commentService.createSubmitComment(payload.advertId, {
      actorId: payload.actorId,
    })
  }

  @OnEvent(LegalGazetteEvents.STATUS_CHANGED)
  async handleStatusChangedEvent(payload: CreateStatusChangeCommentEvent) {
    this.logger.info('Handling status.changed event', {
      payload,
      context: 'CommentListener',
    })

    await this.commentService.createStatusUpdateComment(payload.advertId, {
      actorId: payload.actorId,
      receiverId: payload.statusId,
    })
  }
}
