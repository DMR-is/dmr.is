import { Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import {
  GetApplicationAdverts,
  GetApplicationAdvertsQuery,
  PostApplicationComment,
} from '@dmr.is/official-journal/modules/application'
import {
  GetApplicationAttachmentsResponse,
  GetApplicationCaseResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/official-journal/modules/attachment'
import { CasePriceResponse } from '@dmr.is/official-journal/modules/case'
import { GetComments } from '@dmr.is/official-journal/modules/comment'
import {
  AdvertTemplateDetails,
  AdvertTemplateType,
  GetAdvertTemplateResponse,
} from '@dmr.is/official-journal/modules/journal'
import { UserDto } from '@dmr.is/official-journal/modules/user'
import {
  PresignedUrlResponse,
  S3UploadFilesResponse,
} from '@dmr.is/shared/modules/aws'
import { ResultWrapper } from '@dmr.is/types'

export interface IOfficialJournalApplicationService {
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

export const IOfficialJournalApplicationService = Symbol(
  'IOfficialJournalApplicationService',
)
