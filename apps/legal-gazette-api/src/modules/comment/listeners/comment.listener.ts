import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICommentService } from '../comment.service.interface'
import { CreateSubmitCommentDto } from '../dto/comment.dto'

@Injectable()
export class CommentListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICommentService) private readonly commentService: ICommentService,
    private sequelize: Sequelize,
  ) {}

  @OnEvent('advert.created', { async: true })
  async handleAdvertCreatedEvent(payload: CreateSubmitCommentDto) {
    // we gotta make a new transaction context for CLS to work
    await this.sequelize.transaction(async (_t) => {
      this.logger.info('Handling advert.created event', {
        payload,
        context: 'CommentListener',
      })

      await this.commentService.createSubmitComment(payload)
    })
  }
}
