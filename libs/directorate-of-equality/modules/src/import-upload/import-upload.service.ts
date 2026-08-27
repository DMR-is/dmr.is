import { randomUUID } from 'crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  BadRequestException,
  HttpException,
  HttpStatus,
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

/** Single wording for every place the cap is enforced. */
const TOO_LARGE_MESSAGE = `Uploaded workbook exceeds the ${MAX_UPLOAD_BYTES / ONE_MB}MB limit`

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

    try {
      // The cap has to be pushed down into the download itself. The presigned
      // PUT signs neither Content-Length nor Content-Type, so the staged object
      // can be arbitrarily large, and the URL stays valid for an hour against a
      // key the caller owns — so it can be swapped after any size check we do
      // up front. Capping the stream is the only bound that holds; capping the
      // finished buffer means we already read the whole thing into memory.
      const buffer = this.isLocal
        ? await this.readLocal(key)
        : (
            await this.aws.getObjectBuffer(key, getDoeImportsBucket(), {
              maxBytes: MAX_UPLOAD_BYTES,
            })
          ).unwrap()

      // Backstop only — both branches above already cap the read. This asserts
      // the contract of the functions we just called rather than adding
      // protection.
      if (buffer.length > MAX_UPLOAD_BYTES) {
        throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
      }

      return buffer
    } catch (error) {
      // An object we refused for its size can never become importable, so drop
      // it now rather than leaving it for the bucket lifecycle rule. The
      // controllers only reach cleanup() through their try/finally *after* this
      // method returns, so on a 413 the object would otherwise stay in the
      // bucket — and a caller could loop presign -> PUT something huge ->
      // import -> 413 to park unbounded data there. Rejecting cheaply made that
      // loop fast, so this is the half that closes it.
      //
      // Deleting here is safe precisely because the keyPattern check above has
      // already proven the key sits inside this boundary's own prefix; cleanup()
      // does not validate keys, which is also why the fix does not belong in the
      // controllers' try/finally, where the invalid-key path would reach it.
      //
      // Only for 413. A transient S3 or disk failure must not destroy the
      // caller's upload. The S3 branch's 413 arrives from ResultWrapper.unwrap
      // as a bare HttpException rather than a PayloadTooLargeException, so match
      // on the status, not the subclass.
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
      ) {
        // cleanup() is best-effort and swallows its own failures, so this cannot
        // turn the 413 into a 500.
        await this.cleanup(key)
      }

      throw error
    }
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
      throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
    }

    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
    await writeFile(this.localPath(key), data)

    this.logger.debug('Staged local import upload (S3 bypassed)', {
      context: LOGGING_CONTEXT,
      key,
    })
  }

  private async readLocal(key: string): Promise<Buffer> {
    const path = this.localPath(key)

    let size: number
    try {
      size = (await stat(path)).size
    } catch {
      throw new BadRequestException('Import upload not found')
    }

    // Dev-only path, but it must not read an arbitrarily large file into memory
    // either — check the size on disk before opening it.
    if (size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
    }

    try {
      return await readFile(path)
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
