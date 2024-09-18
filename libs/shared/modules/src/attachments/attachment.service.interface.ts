import { Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IAttachmentService {
  createAttachment(
    applicationId: string,
    attachmentType: AttachmentTypeParam,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteAttachmentByKey(
    applicationId: string,
    key: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  getAttachment(
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse>>

  getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse>>

  getAttachments(
    applicationId: string,
    type: AttachmentTypeParam,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>>
}

export const IAttachmentService = Symbol('IAttachmentService')
