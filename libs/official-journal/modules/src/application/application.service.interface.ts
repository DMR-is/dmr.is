import { Transaction } from 'sequelize'

import { ApplicationEvent, AttachmentTypeParam } from '@dmr.is/constants'
import {
  AdvertTemplateDetails,
  AdvertTemplateType,
  CasePriceResponse,
  GetAdvertTemplateResponse,
  GetApplicationAdverts,
  GetApplicationAdvertsQuery,
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  GetApplicationResponse,
  GetComments,
  PostApplicationAttachmentBody,
  PostApplicationComment,
  PresignedUrlResponse,
  S3UploadFilesResponse,
  UpdateApplicationBody,
  UserDto,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IApplicationService {
  getApplication(id: string): Promise<ResultWrapper<GetApplicationResponse>>

  updateApplication(
    id: string,
    answers?: UpdateApplicationBody,
  ): Promise<ResultWrapper>

  submitApplication(id: string, event: ApplicationEvent): Promise<ResultWrapper>

  /**
   * Re-opens a submitted application by moving it back to the draft_retry state.
   * Intended to recover applications that ended up stuck in the submitted state
   * (e.g. island.is errored before a case was created on our side).
   * Only applications currently in the submitted state can be re-opened.
   * @param id Application id
   */
  reopenApplication(id: string): Promise<ResultWrapper>

  postApplication(id: string): Promise<ResultWrapper>

  getComments(applicationId: string): Promise<ResultWrapper<GetComments>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
    applicationUser: UserDto,
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
    ResultWrapper<AdvertTemplateDetails[]>
  >

  getApplicationAdverts(
    query: GetApplicationAdvertsQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAdverts>>
}

export const IApplicationService = Symbol('IApplicationService')
