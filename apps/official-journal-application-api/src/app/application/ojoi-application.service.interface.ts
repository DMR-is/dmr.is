import { Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import { GetApplicationCaseResponse } from '@dmr.is/official-journal/dto/application/application-case.dto'
import { AdvertTemplateType } from '@dmr.is/official-journal/dto/application/application-template-type.dto'
import { GetComments } from '@dmr.is/official-journal/dto/comment/comment.dto'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import {
  GetApplicationAttachmentsResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import {
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationPriceResponse } from './dto/application-price-response.dto'
import {
  AdvertTemplateDetails,
  GetAdvertTemplateResponse,
} from './dto/get-advert-template-response.dto'
import {
  GetApplicationAdverts,
  GetApplicationAdvertsQuery,
} from './dto/get-application-advert.dto'
import { PostApplicationComment } from './dto/post-application-comment.dto'

export interface IOfficialJournalApplicationService {
  getComments(applicationId: string): Promise<ResultWrapper<GetComments>>

  postComment(
    applicationId: string,
    commentBody: PostApplicationComment,
    applicationUser: UserDto,
  ): Promise<ResultWrapper>

  getPrice(
    applicationId: string,
  ): Promise<ResultWrapper<ApplicationPriceResponse>>

  uploadAttachments(
    applicationId: string,
    files: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<S3UploadFilesResponse>>

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

  postApplication(
    applicationId: string,
    currentUser: UserDto,
  ): Promise<ResultWrapper>
}

export const IOfficialJournalApplicationService = Symbol(
  'IOfficialJournalApplicationService',
)
