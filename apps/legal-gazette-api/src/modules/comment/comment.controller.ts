import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import {  TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  CommentDto,
  CreateTextCommentBodyDto,
  GetCommentsDto,
} from '../../models/comment.model'
import { ICommentService } from './comment.service.interface'

@Controller({
  path: 'comments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class CommentController {
  constructor(
    @Inject(ICommentService) private commentService: ICommentService,
  ) {}

  @Get('/:advertId')
  @LGResponse({ operationId: 'getCommentsByAdvertId', type: GetCommentsDto })
  getCommentsByAdvertId(
    @Param('advertId') advertId: string,
  ): Promise<GetCommentsDto> {
    return this.commentService.getCommentsByAdvertId(advertId)
  }

  @Post('/:advertId')
  @LGResponse({ operationId: 'postComment', type: CommentDto })
  postComment(
    @Param('advertId') advertId: string,
    @Body() body: CreateTextCommentBodyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<CommentDto> {
    return this.commentService.createTextComment(advertId, {
      actorId: user.nationalId,
      comment: body.comment,
    })
  }
}
