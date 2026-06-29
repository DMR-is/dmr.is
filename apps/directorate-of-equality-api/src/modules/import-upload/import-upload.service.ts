import { randomUUID } from 'crypto'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

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

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** doe-imports/<boundary>/<uuid>.xlsx */
const keyPattern = (boundary: ImportUploadBoundary) =>
  new RegExp(`^${KEY_PREFIX}/${boundary}/${UUID}\\.xlsx$`)

/** Matches a key for any known boundary — used when the boundary isn't known yet. */
const anyKeyPattern = new RegExp(
  `^${KEY_PREFIX}/(${Object.values(ImportUploadBoundary).join('|')})/${UUID}\\.xlsx$`,
)

/** Where local-mode uploads are staged on disk instead of S3. */
const LOCAL_UPLOAD_DIR = join(tmpdir(), 'doe-import-uploads')

@Injectable()
export class ImportUploadService implements IImportUploadService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  /**
   * Local development has no S3 bucket configured. When that's the case we skip
   * S3 entirely: `createUpload` hands back a URL pointing at this API's own
   * local PUT endpoint, and fetch/cleanup read and delete from a temp dir. The
   * `AWS_SALARY_ANALYSIS_FILES_BUCKET` env var is the signal — it's always set
   * in deployed environments and never set locally, so this can't trip in prod.
   */
  private get isLocal(): boolean {
    return !process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET
  }

  async createUpload(
    boundary: ImportUploadBoundary,
  ): Promise<PresignUploadResponseDto> {
    const key = `${KEY_PREFIX}/${boundary}/${randomUUID()}.xlsx`

    if (this.isLocal) {
      // The web's putWorkbookToPresignedUrl PUTs the file to whatever URL it's
      // given, so we point it at our own endpoint instead of S3.
      const url = this.localUploadUrl(key)

      this.logger.debug('Issued local import upload URL (S3 bypassed)', {
        context: LOGGING_CONTEXT,
        boundary,
        key,
      })

      return { url, key }
    }

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
    // Reject anything outside this boundary's own prefix before touching
    // storage — the key is client-supplied and must not become an
    // arbitrary-object read.
    if (!keyPattern(boundary).test(key)) {
      throw new BadRequestException('Invalid import upload key')
    }

    const buffer = this.isLocal
      ? await this.readLocal(key)
      : (await this.aws.getObjectBuffer(key, getDoeImportsBucket())).unwrap()

    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Uploaded workbook exceeds the ${MAX_UPLOAD_BYTES / ONE_MB}MB limit`,
      )
    }

    return buffer
  }

  async cleanup(key: string): Promise<void> {
    try {
      if (this.isLocal) {
        await rm(this.localPath(key), { force: true })
        return
      }

      await this.aws.deleteObject(key, getDoeImportsBucket())
    } catch (error) {
      // Best-effort: a stale object is reaped by the bucket lifecycle rule
      // (or, locally, by the OS temp dir).
      this.logger.warn('Failed to delete staged import object', {
        context: LOGGING_CONTEXT,
        key,
        error,
      })
    }
  }

  async storeLocalUpload(key: string, data: Buffer): Promise<void> {
    // Hard guard: this path only exists for local development. In a deployed
    // environment the bucket is set and we must never accept raw uploads here.
    if (!this.isLocal) {
      throw new BadRequestException('Local import upload is disabled')
    }

    if (!anyKeyPattern.test(key)) {
      throw new BadRequestException('Invalid import upload key')
    }

    if (data.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `Uploaded workbook exceeds the ${MAX_UPLOAD_BYTES / ONE_MB}MB limit`,
      )
    }

    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
    await writeFile(this.localPath(key), data)

    this.logger.debug('Staged local import upload (S3 bypassed)', {
      context: LOGGING_CONTEXT,
      key,
    })
  }

  private async readLocal(key: string): Promise<Buffer> {
    try {
      return await readFile(this.localPath(key))
    } catch {
      throw new BadRequestException('Import upload not found')
    }
  }

  /** Flatten the namespaced key to a single safe filename. Key is pre-validated. */
  private localPath(key: string): string {
    return join(LOCAL_UPLOAD_DIR, key.replace(/\//g, '_'))
  }

  private localUploadUrl(key: string): string {
    const port = process.env.DIRECTORATE_OF_EQUALITY_API_PORT || 5100
    // Matches the API's global prefix ('api') + URI version ('v1'); the endpoint
    // is unguarded and gated by the local-mode check in storeLocalUpload.
    return `http://localhost:${port}/api/v1/imports/local?key=${encodeURIComponent(key)}`
  }
}
