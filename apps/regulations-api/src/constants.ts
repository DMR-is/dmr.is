import { ensurePosInt } from '@dmr.is/regulations-tools/utils'

const AWS_PRESIGNED_POST_EXPIRES_DEFAULT = 600

const { AWS_BUCKET_NAME = '', API_SERVER, MEDIA_BUCKET_FOLDER } = process.env

/**
 * The region the PDF cache bucket lives in.
 *
 * `AWS_REGION_NAME` is our own name for this and is not set in any environment
 * — it is absent from the infrastructure repo entirely. ECS injects the
 * standard `AWS_REGION` / `AWS_DEFAULT_REGION` on every task, so fall back to
 * those rather than silently resolving to '' (which produced the malformed
 * host `<bucket>.s3..amazonaws.com` and made every cache read fail DNS).
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

export const PDF_TEMPLATE_UPDATED = '2022-02-26T15:40'

export { FILE_SERVER } from '@dmr.is/regulations-tools/constants'

/** prefix/root-folder for uploading files/documents for draft regulations */
export const DRAFTS_FOLDER = 'admin-drafts'
