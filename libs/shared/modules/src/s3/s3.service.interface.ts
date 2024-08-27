import { S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IS3Service {
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
  getPresignedUrl(
    applicationId: string,
    fileName: string,
    fileType: string,
    isOriginal?: boolean,
  ): Promise<ResultWrapper<string>>
}

export const IS3Service = Symbol('IS3Service')
