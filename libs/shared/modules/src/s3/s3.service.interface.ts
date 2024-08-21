import { ResultWrapper } from '@dmr.is/types'

import 'multer'

export interface IS3Service {
  uploadApplicationAttachment(
    applicationId: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper>
}

export const IS3Service = Symbol('IS3Service')
