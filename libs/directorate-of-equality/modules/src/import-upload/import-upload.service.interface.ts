import { PresignUploadResponseDto } from './dto/presign-upload-response.dto'

/**
 * Guard boundaries that may stage import uploads. Keys are namespaced per
 * boundary so an endpoint can only read objects uploaded for its own audience,
 * keeping the admin/application separation at the object level.
 */
export enum ImportUploadBoundary {
  ADMIN = 'admin',
  APPLICATION = 'application',
}

export interface IImportUploadService {
  /** Generate a namespaced key + presigned PUT URL for a workbook upload. */
  createUpload(boundary: ImportUploadBoundary): Promise<PresignUploadResponseDto>

  /**
   * Throw unless `key` sits inside `boundary`'s own prefix.
   *
   * Exposed separately from {@link fetchWorkbook} because the parse gate is
   * acquired *before* the download — a caller must be able to reject a
   * client-supplied key without first taking a slot, so a bad key cannot occupy
   * the queue.
   */
  assertKeyWithinBoundary(key: string, boundary: ImportUploadBoundary): void

  /**
   * Validate the key against the boundary, fetch the object from S3 and enforce
   * the size cap. Returns the workbook buffer ready to parse.
   *
   * Allocates up to the upload cap, so callers must already hold a parse slot
   * when they call this.
   */
  fetchWorkbook(key: string, boundary: ImportUploadBoundary): Promise<Buffer>

  /**
   * Best-effort delete of a staged object once it has been consumed.
   *
   * Takes the boundary because it validates the key itself. Callers reach this
   * from `catch`/`finally` blocks that can now be entered on the invalid-key
   * path, so it must not treat a caller-supplied key as trustworthy. Never
   * throws — it runs while another error is in flight.
   */
  cleanup(key: string, boundary: ImportUploadBoundary): Promise<void>

  /**
   * Local-development only: accept raw workbook bytes and stage them on disk
   * under `key`, standing in for the S3 PUT. Throws when a bucket is configured
   * (i.e. in any deployed environment) so the path is inert outside local dev.
   */
  storeLocalUpload(key: string, data: Buffer): Promise<void>
}

export const IImportUploadService = Symbol('IImportUploadService')
