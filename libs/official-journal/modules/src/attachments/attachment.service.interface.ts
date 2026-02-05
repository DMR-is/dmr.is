import { Transaction } from 'sequelize'

import { AttachmentTypeParam } from '@dmr.is/constants'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationAttachmentTypeModel } from './models'

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

  getApplicationAttachment(
    applicationId: string,
    typeId?: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse | null>>

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
