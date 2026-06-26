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
   * Validate the key against the boundary, fetch the object from S3 and enforce
   * the size cap. Returns the workbook buffer ready to parse.
   */
  fetchWorkbook(key: string, boundary: ImportUploadBoundary): Promise<Buffer>

  /** Best-effort delete of a staged object once it has been consumed. */
  cleanup(key: string): Promise<void>
}

export const IImportUploadService = Symbol('IImportUploadService')
