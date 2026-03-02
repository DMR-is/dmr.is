import { CommentDto } from '../../models/comment.model'
import {
  CreateAssignCommentDto,
  CreatePublishCommentDto,
  CreateStatusUpdateCommentDto,
  CreateSubmitCommentDto,
  CreateTextCommentDto,
  GetCommentsDto,
} from './dto/comment.dto'

export interface ICommentService {
  getCommentsByAdvertId(advertId: string): Promise<GetCommentsDto>

  deleteComment(advertId: string, commentId: string): Promise<void>
  createSubmitComment(
    advertId: string,
    body: CreateSubmitCommentDto,
  ): Promise<void>

  createAssignComment(
    advertId: string,
    body: CreateAssignCommentDto,
  ): Promise<CommentDto>

  createStatusUpdateComment(
    advertId: string,
    body: CreateStatusUpdateCommentDto,
  ): Promise<CommentDto>

  createSubmitCommentForExternalSystem(
    advertId: string,
    actorId: string,
    actorName: string,
  ): Promise<void>

  createTextComment(
    advertId: string,
    body: CreateTextCommentDto,
  ): Promise<CommentDto>

  createPublishComment(
    advertId: string,
    body: CreatePublishCommentDto,
  ): Promise<void>
}

export const ICommentService = Symbol('ICommentService')
