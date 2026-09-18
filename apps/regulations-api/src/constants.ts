import { ensurePosInt } from '@dmr.is/regulations-tools/utils'

const AWS_PRESIGNED_POST_EXPIRES_DEFAULT = 600

const { AWS_BUCKET_NAME = '', API_SERVER, MEDIA_BUCKET_FOLDER } = process.env

/**
 * The region the PDF cache bucket lives in.
 *
 * `AWS_REGION_NAME` is our own name for this and is set in no environment,
 * deployed or local. ECS injects the standard `AWS_REGION` /
 * `AWS_DEFAULT_REGION` on every task, so fall back to those rather than
 * silently resolving to '' (which produced the malformed host
 * `<bucket>.s3..amazonaws.com` and made every cache read fail DNS).
 */
const AWS_REGION_NAME =
  process.env.AWS_REGION_NAME ||
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  ''

if (!AWS_BUCKET_NAME || !AWS_REGION_NAME || !API_SERVER) {
  // eslint-disable-next-line no-console
  console.error(
    'AWS_BUCKET_NAME, AWS_REGION_NAME and/or API_SERVER not configured',
  )

  // TODO: Add this error back in when env variables are set.
  // throw new Error(
  //   'AWS_BUCKET_NAME, AWS_REGION_NAME and/or API_SERVER not configured',
  // );
}

export { AWS_BUCKET_NAME, AWS_REGION_NAME, MEDIA_BUCKET_FOLDER }

/** AWS_PRESIGNED_POST_EXPIRES parsed from env or AWS_PRESIGNED_POST_EXPIRES_DEFAULT */
export const AWS_PRESIGNED_POST_EXPIRES =
  ensurePosInt(process.env.AWS_PRESIGNED_POST_EXPIRES ?? '') ||
  AWS_PRESIGNED_POST_EXPIRES_DEFAULT

export const OLD_SERVER = 'https://www.reglugerd.is'

export const API_URL = API_SERVER + '/api/v1/regulation'

/**
 * Cached PDFs rendered before this timestamp are regenerated on next request.
 *
 * Bump this whenever the PDF template or `RegulationPdf.css` changes, otherwise
 * the cache keeps serving documents rendered with the old styling.
 *
 * Compared lexicographically against `toISODateTime()`, which yields
 * `YYYY-MM-DDTHH:mm:ss` — keep this in the same format.
 *
 * Previously stuck at 2022-02-26 while the stylesheet changed in Aug 2025 and
 * the bucket holds objects seeded 2025-02-14, so nothing would ever have been
 * invalidated. That was harmless only because the cache itself was broken.
 */
export const PDF_TEMPLATE_UPDATED = '2026-08-10T00:00:00'

export { FILE_SERVER } from '@dmr.is/regulations-tools/constants'

/** prefix/root-folder for uploading files/documents for draft regulations */
export const DRAFTS_FOLDER = 'admin-drafts'
