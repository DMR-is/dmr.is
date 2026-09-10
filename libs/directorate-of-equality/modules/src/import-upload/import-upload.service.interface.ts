import { PresignUploadResponseDto } from './dto/presign-upload-response.dto'

/**
 * Guard boundaries that may stage import uploads. Keys are namespaced per
 * boundary so an endpoint can only read objects uploaded for its own audience,
 * keeping the admin/application separation at the object level.
 */
export enum ImportUploadBoundary {
  ADMIN = 'admin',
  APPLICATION = 'application',
  /**
   * Files an admin attaches to a custom email. Staging only — the object is
   * moved to the company-files bucket once the batch has been sent, so nothing
   * outbound is ever served from this prefix.
   *
   * Its own boundary rather than reusing ADMIN: the prefixes exist so an
   * endpoint can only read objects staged for its own audience, and an
   * attachment and an import workbook are read by different endpoints under
   * different caps.
   */
  MAIL_ATTACHMENT = 'mail-attachment',
}

export interface IImportUploadService {
  /**
   * Generate a namespaced key + presigned PUT URL for an upload.
   *
   * `extension` defaults to `xlsx` — the only kind this served originally — and
   * must be one the service allows; anything else is a 400. The extension ends
   * up in the key, so this is the boundary that decides what may be staged at
   * all.
   */
  createUpload(
    boundary: ImportUploadBoundary,
    opts?: { extension?: string },
  ): Promise<PresignUploadResponseDto>

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
   * Validate the key against the boundary, fetch the object from S3 and enforce
   * `maxBytes` (defaulting to the workbook cap).
   *
   * The general form of {@link fetchWorkbook}, which is now a thin wrapper over
   * it. Split out rather than widening `fetchWorkbook` because that method's
   * name carries a real contract — callers must already hold a parse slot — and
   * a mail attachment takes no slot and is held to a far smaller cap.
   */
  fetchObject(
    key: string,
    boundary: ImportUploadBoundary,
    maxBytes?: number,
  ): Promise<Buffer>

  /**
   * Best-effort delete of a staged object, but only when `error` says the
   * outcome was terminal for it. Omit `error` to record success.
   *
   * The single entry point for cleanup, so the terminal-vs-transient rule has
   * one definition rather than one per controller. It was six copies of a
   * `finally` before, and five of them were wrong.
   *
   * Takes the boundary because it validates the key itself: the download moved
   * inside the gated service call, so `catch` blocks are now reachable on the
   * invalid-key path and a caller-supplied key must not be trusted here. Never
   * throws — it runs while another error is in flight.
   */
  cleanupAfter(
    key: string,
    boundary: ImportUploadBoundary,
    error?: unknown,
  ): Promise<void>

  /**
   * Local-development only: accept raw workbook bytes and stage them on disk
   * under `key`, standing in for the S3 PUT. Throws when a bucket is configured
   * (i.e. in any deployed environment) so the path is inert outside local dev.
   */
  storeLocalUpload(key: string, data: Buffer): Promise<void>
}

export const IImportUploadService = Symbol('IImportUploadService')
