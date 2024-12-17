import { ApplicationEvent, AttachmentTypeParam } from '@dmr.is/constants'
import {
  AdvertTemplateType,
  ApplicationUser,
  CasePriceResponse,
  GetAdvertTemplateResponse,
  GetAdvertTemplatesResponse,
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  GetApplicationResponse,
  GetCaseCommentsResponse,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
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
    applicationUser: ApplicationUser,
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
  getPresignedUrl(key: string): Promise<ResultWrapper<PresignedUrlResponse>>

  /**
   * Adds an attachment to an application.
   * After a user has uploaded attachment with the presigned URL, the attachment is added to the application.
   * @param applicationId
   * @param body
   */
  addApplicationAttachment(
    applicationId: string,
    attachmentType: AttachmentTypeParam,
    body: PostApplicationAttachmentBody,
  ): Promise<ResultWrapper>

  getApplicationAttachments(
    applicationId: string,
    type: AttachmentTypeParam,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>>

  deleteApplicationAttachment(
    applicationId: string,
    key: string,
  ): Promise<ResultWrapper>

  getApplicationCase(
    applicationId: string,
  ): Promise<ResultWrapper<GetApplicationCaseResponse>>

  getApplicationAdvertTemplate(
    type: AdvertTemplateType,
  ): Promise<ResultWrapper<GetAdvertTemplateResponse>>

  getApplicationAdvertTemplates(): Promise<
    ResultWrapper<GetAdvertTemplatesResponse>
  >
}

export const IApplicationService = Symbol('IApplicationService')
