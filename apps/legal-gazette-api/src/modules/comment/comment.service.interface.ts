import {
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
  ): Promise<void>

  createAssignComment(
    advertId: string,
    body: CreateAssignCommentDto,
  ): Promise<void>

  createStatusUpdateComment(
    advertId: string,
    body: CreateStatusUpdateCommentDto,
  ): Promise<void>

  createSubmitCommentForExternalSystem(
    advertId: string,
    actorId: string,
    actorName: string,
  ): Promise<void>

  createTextComment(advertId: string, body: CreateTextCommentDto): Promise<void>
}

export const ICommentService = Symbol('ICommentService')
