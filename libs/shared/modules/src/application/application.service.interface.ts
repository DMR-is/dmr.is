import {
  Application,
  GetCaseCommentsResponse,
  PostApplicationComment,
  PostCaseCommentResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'

import { Result } from '../types/result'

export interface IApplicationService {
  getApplication(id: string): Promise<Application | null>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<Application | null>

  submitApplication(id: string): Promise<Result<undefined>>

  postApplication(id: string): Promise<Result<undefined>>

  getComments(applicationId: string): Promise<Result<GetCaseCommentsResponse>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<Result<PostCaseCommentResponse>>
}

export const IApplicationService = Symbol('IApplicationService')
