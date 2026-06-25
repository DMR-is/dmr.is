import { randomUUID } from 'crypto'

import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { getDoeImportsBucket } from '@dmr.is/utils-server/serverUtils'

import { PresignUploadResponseDto } from './dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from './import-upload.service.interface'

const LOGGING_CONTEXT = 'ImportUploadService'

const KEY_PREFIX = 'doe-imports'
const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

/** doe-imports/<boundary>/<uuid>.xlsx */
const keyPattern = (boundary: ImportUploadBoundary) =>
  new RegExp(
    `^${KEY_PREFIX}/${boundary}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.xlsx$`,
  )

@Injectable()
export class ImportUploadService implements IImportUploadService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  async createUpload(
    boundary: ImportUploadBoundary,
  ): Promise<PresignUploadResponseDto> {
    const key = `${KEY_PREFIX}/${boundary}/${randomUUID()}.xlsx`
    const { url } = (
      await this.aws.getPresignedUrl(key, getDoeImportsBucket())
    ).unwrap()

    this.logger.debug('Issued presigned import upload URL', {
      context: LOGGING_CONTEXT,
      boundary,
      key,
    })

    return { url, key }
  }

  async fetchWorkbook(
    key: string,
    boundary: ImportUploadBoundary,
  ): Promise<Buffer> {
    // Reject anything outside this boundary's own prefix before touching S3 —
    // the key is client-supplied and must not become an arbitrary-object read.
    if (!keyPattern(boundary).test(key)) {
      throw new BadRequestException('Invalid import upload key')
    }

    const buffer = (
      await this.aws.getObjectBuffer(key, getDoeImportsBucket())
    ).unwrap()

    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Uploaded workbook exceeds the ${MAX_UPLOAD_BYTES / ONE_MB}MB limit`,
      )
    }

    return buffer
  }

  async cleanup(key: string): Promise<void> {
    try {
      await this.aws.deleteObject(key, getDoeImportsBucket())
    } catch (error) {
      // Best-effort: a stale object is reaped by the bucket lifecycle rule.
      this.logger.warn('Failed to delete staged import object', {
        context: LOGGING_CONTEXT,
        key,
        error,
      })
    }
  }
}
