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
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../decorators/lg-response.decorator'
import {
  CommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from './dto/comment.dto'
import { ICommentService } from './comment.service.interface'

@Controller({
  path: 'comments',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
    @Body() body: CreateTextCommentDto,
  ): Promise<CommentDto> {
    return this.commentService.createTextComment(advertId, body)
  }
}
