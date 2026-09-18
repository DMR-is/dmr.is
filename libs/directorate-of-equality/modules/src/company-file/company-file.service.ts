import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'

import {
  CompanyFileUpload,
  ICompanyFileService,
} from './company-file.service.interface'

const LOGGING_CONTEXT = 'CompanyFileService'

/** Prefix every archived document sits under, inside the bucket. */
const KEY_PREFIX = 'company-files'

/**
 * The bucket holding documents issued to companies.
 *
 * ⚠️ **Deliberately NOT `AWS_SALARY_ANALYSIS_FILES_BUCKET`.** That bucket exists
 * to receive applicant-uploaded Excel workbooks through presigned PUTs and
 * carries the access posture that job needs. These are outbound documents the
 * Directorate issued — a different lifecycle, a different retention question and
 * a locked-down read path (presigned GET) — so they get their own bucket.
 *
 * Read at call time, not module load, so a deployment can turn archiving on with
 * a restart and tests can exercise both paths.
 *
 * Set means archive, unset means skip — and "unset" covers the three shapes the
 * value actually arrives in: `undefined` (absent), `''` (declared with no value,
 * which is how the schema itself writes it), and whitespace. Trimming also means
 * a space-padded name from a task definition archives to the intended bucket
 * rather than failing at S3 with an obscure name error.
 */
const bucket = (): string | undefined =>
  process.env.AWS_DOE_COMPANY_FILES_BUCKET?.trim() || undefined

/** `YYYY-MM-DD` from an instant's UTC parts. */
const issuedOn = (date: Date): string => date.toISOString().slice(0, 10)

@Injectable()
export class CompanyFileService implements ICompanyFileService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  async archive(uploads: CompanyFileUpload[]): Promise<string[]> {
    const target = bucket()

    if (!target) {
      // Unset locally and until infra provisions the bucket. Archiving is off
      // rather than erroring on every approval, mirroring how
      // `ImportUploadService` treats an absent bucket as "not configured here".
      //
      /*
       * ⚠️ **Warn, not debug.** Production `LOG_LEVEL` is `info`, so a debug line
       * meant a deployed API archived nothing and said nothing about it — "did we
       * keep a copy of what we sent?" was unanswerable from the logs.
       *
       * Deliberately noisy until the bucket is provisioned: one line per
       * approval, each one true. The permanent fix is making the variable
       * required when deployed, which the env schema carries a note for; this is
       * what surfaces the gap in the meantime.
       */
      this.logger.warn(
        'Not archiving company files — AWS_DOE_COMPANY_FILES_BUCKET is not set, so no copy of the documents just sent is being kept',
        { context: LOGGING_CONTEXT, fileCount: uploads.length },
      )
      return []
    }

    const written: string[] = []

    for (const upload of uploads) {
      const key = `${KEY_PREFIX}/${upload.companyNationalId}/${issuedOn(upload.issuedAt)}-${upload.filename}`

      try {
        const result = await this.aws.uploadObject(
          target,
          key,
          upload.filename,
          upload.content,
        )

        // ⚠️ The URL `uploadObject` returns is `ADVERTS_CDN_URL/<filename>` — an
        // Official Journal notion, built from the file name rather than the key,
        // and meaningless here. The KEY is the handle; it is what a presigned
        // GET will be built from later. Do not propagate that URL.
        if (result.result.ok === false) {
          this.logger.error('Failed to archive company file', {
            context: LOGGING_CONTEXT,
            key,
            error: result.result.error,
          })
          continue
        }

        this.logger.info('Archived company file', {
          context: LOGGING_CONTEXT,
          key,
          bytes: upload.content.length,
        })
        written.push(key)
      } catch (error) {
        /*
         * Retained, but narrowly. `uploadObject` is `@LogAndHandle()`-decorated
         * and cannot reject, so this cannot see an S3 failure — that is the
         * branch above. What it does cover is a throw while BUILDING the call:
         * `issuedOn` on an invalid Date, or a future undecorated implementation.
         *
         * Keeping a catch that cannot see the main failure is exactly the shape
         * this PR set out to fix elsewhere, so it says so rather than implying
         * it guards the upload.
         */
        this.logger.error('Failed to archive company file', {
          context: LOGGING_CONTEXT,
          key,
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return written
  }
}
