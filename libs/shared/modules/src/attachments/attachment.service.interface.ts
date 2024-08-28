import { Transaction } from 'sequelize'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IAttachmentService {
  createAttachment(
    applicationId: string,
    fileName: string,
    originalFileName: string,
    fileFormat: string,
    fileExtension: string,
    fileLocation: string,
    fileSize: number,
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
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>>
}

export const IAttachmentService = Symbol('IAttachmentService')
