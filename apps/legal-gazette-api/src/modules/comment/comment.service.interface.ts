import {
  CommentDto,
  CreateAssignCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from './dto/comment.dto'

export interface ICommentService {
  getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto>

  deleteComment(commentId: string): Promise<void>
  createSubmitComment(body: CreateSubmitCommentDto): Promise<CommentDto>

  createAssignComment(body: CreateAssignCommentDto): Promise<CommentDto>

  createStatusUpdateComment(
    body: CreateStatusUpdateCommentDto,
  ): Promise<CommentDto>

  createTextComment(body: CreateTextCommentDto): Promise<CommentDto>
}

export const ICommentService = Symbol('ICommentService')
