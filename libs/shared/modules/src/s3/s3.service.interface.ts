import { S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IS3Service {
  uploadApplicationAttachments(
    applicationId: string,
    file: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<Array<S3UploadFileResponse>>>
}

export const IS3Service = Symbol('IS3Service')
