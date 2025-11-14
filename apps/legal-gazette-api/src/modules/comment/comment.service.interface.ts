import {
  CommentDto,
  CreateAssignCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from '../../models/comment.model'

export interface ICommentService {
  getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto>

  deleteComment(advertId: string, commentId: string): Promise<void>
  createSubmitComment(
    advertId: string,
    body: CreateSubmitCommentDto,
  ): Promise<CommentDto>

  createAssignComment(
    advertId: string,
    body: CreateAssignCommentDto,
  ): Promise<CommentDto>

  createStatusUpdateComment(
    advertId: string,
    body: CreateStatusUpdateCommentDto,
  ): Promise<CommentDto>

  createTextComment(
    advertId: string,
    body: CreateTextCommentDto,
  ): Promise<CommentDto>
}

export const ICommentService = Symbol('ICommentService')
