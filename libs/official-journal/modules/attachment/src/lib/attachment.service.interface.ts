import { Transaction } from 'sequelize'
import { AttachmentTypeParam } from '@dmr.is/constants'
import { ResultWrapper } from '@dmr.is/types'
import { ApplicationAttachmentTypeModel } from '@dmr.is/official-journal/models'
import { GetApplicationAttachmentResponse } from './dto/get-application-attachment.response'
import { GetApplicationAttachmentsResponse } from './dto/get-application-attachments.response'
import { PostApplicationAttachmentBody } from './dto/post-application-attachment.body'

export interface CreateAttachmentParams {
  params: {
    applicationId: string
    attachmentType: AttachmentTypeParam
    body: PostApplicationAttachmentBody
    caseId?: string
  }
  transaction?: Transaction
}

export interface IAttachmentService {
  createAttachment(
    params: CreateAttachmentParams,
  ): Promise<ResultWrapper<{ id: string }>>

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

  getAllAttachments(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>>

  attachmentTypeLookup(
    type: AttachmentTypeParam,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationAttachmentTypeModel>>

  createCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const IAttachmentService = Symbol('IAttachmentService')
