import { SentMessageInfo } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import { PresignedUrlResponse, S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IAWSService {
  uploadApplicationAttachments(
    applicationId: string,
    file: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<Array<S3UploadFileResponse>>>

  /**
   * Get a presigned URL for uploading a file to S3
   * @param applicationId The ID of the application
   * @param fileName The name of the file
   * @param fileType The type of the file
   * @param isOriginal Whether the file is the original file or additions/documents
   * @returns a presigned URL
   */
  getPresignedUrl(key: string): Promise<ResultWrapper<PresignedUrlResponse>>

  /**
   * Deletes object from S3 bucket
   * @param key The key of the object to delete
   */
  deleteObject(key: string): Promise<ResultWrapper>

  getObject(key: string): Promise<ResultWrapper<string>>

  uploadObject(
    bucket: string,
    key: string,
    fileName: string,
    data: Buffer,
  ): Promise<ResultWrapper<string>>

  sendMail(message: Mail.Options): Promise<SentMessageInfo>
  replaceAdvertPdf(
    key: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>>
}

export const IAWSService = Symbol('IAWSService')
