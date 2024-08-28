import { ApplicationEvent } from '@dmr.is/constants'
import {
  CasePriceResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationComment,
  S3UploadFilesResponse,
  UpdateApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IApplicationService {
  getApplication(id: string): Promise<ResultWrapper<GetApplicationResponse>>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<ResultWrapper>

  submitApplication(id: string, event: ApplicationEvent): Promise<ResultWrapper>

  postApplication(id: string): Promise<ResultWrapper>

  getComments(
    applicationId: string,
  ): Promise<ResultWrapper<GetCaseCommentsResponse>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
  ): Promise<ResultWrapper>

  getPrice(applicationId: string): Promise<ResultWrapper<CasePriceResponse>>

  uploadAttachments(
    applicationId: string,
    files: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<S3UploadFilesResponse>>

  /**
   * Gets a presigned url from the S3 service.
   * @param applicationId
   * @param fileName
   * @param fileType
   * @param isOriginal
   * @returns A presigned URL.
   */
  getPresignedUrl(
    applicationId: string,
    fileName: string,
    fileType: string,
    isOriginal: boolean,
  ): Promise<ResultWrapper<string>>
}

export const IApplicationService = Symbol('IApplicationService')
