import { Transaction } from 'sequelize'
import { AttachmentTypeParams } from '@dmr.is/constants'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IAttachmentService {
  createAttachment(
    applicationId: string,
    attachmentType: AttachmentTypeParams,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  deleteAttachment(
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>

  getAttachment(
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse>>

  getAttachments(
    applicationId: string,
    type: AttachmentTypeParams,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>>
}

export const IAttachmentService = Symbol('IAttachmentService')
