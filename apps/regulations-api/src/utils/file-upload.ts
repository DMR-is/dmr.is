import { createHash } from 'crypto'
import type { FastifyRequest } from 'fastify'
import file_type from 'file-type'
import isSvg from 'is-svg'
import sharp from 'sharp'

import { ensureRegName, nameToSlug } from '@dmr.is/regulations-tools/utils'

import {
  AWS_BUCKET_NAME,
  AWS_REGION_NAME,
  DRAFTS_FOLDER,
  MEDIA_BUCKET_FOLDER,
} from '../constants'
import { ensureFileScopeToken, ensureUploadTypeHeader } from './misc'

import { S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { MultipartFile } from '@fastify/multipart'

/** The slice of a request that `getKey()` reads. `FastifyRequest` satisfies
 * this structurally, and so do the plain objects the characterization tests
 * hand it. */
type KeyRequest = Pick<FastifyRequest, 'headers'> & {
  query: Record<string, unknown>
}

/** The mutable slice of an uploaded file that `getKey()` reads — and, in the
 * case of `isPasted`, writes. */
type UploadFileInfo = {
  originalname: string
  /** First 8 hex characters of the file's MD5, baked into the object key. */
  $hash$?: string
  /** Set by `getKey()`; decides whether the PNG -> JPEG transform runs. */
  isPasted?: boolean
}

export type UploadedFile = {
  /** The S3 object key the file ended up under. */
  key: string
}

const getSingleQuery = (req: KeyRequest, param: string): string => {
  let value = req.query[param] as string | Array<string> | undefined
  if (value && typeof value !== 'string') {
    value = value[0]
  }
  return value || ''
}

/** Computes the S3 object key for an uploaded file.
 *
 * Exported for characterization tests — the exact strings this returns are the
 * contract for every piece of media already sitting in the bucket. */
export const getKey = (req: KeyRequest, file: UploadFileInfo) => {
  const regName = ensureRegName(getSingleQuery(req, 'scope'))

  const folder = ensureFileScopeToken(
    getSingleQuery(req, 'folder') || (regName ? nameToSlug(regName) : ''),
  )

  const rootFolder =
    ensureUploadTypeHeader(req) === 'draft' ? DRAFTS_FOLDER : ''
  const devFolder = MEDIA_BUCKET_FOLDER || ''
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalName = file.originalname
    .split('/')
    .pop()!
    // normalized names of pasted blobs
    .replace(/^blobid\d+.png$/, 'pasted--image.png')
  let fileNamePart = originalName.replace(/\.[^.]+$/, '')
  const fileExtension = originalName.slice(fileNamePart.length).toLowerCase()
  if (/^pasted--image/.test(fileNamePart)) {
    file.isPasted = true
    fileNamePart = fileNamePart.replace(/^pasted--/, '')
  }
  const hash = file.$hash$ ? '--' + file.$hash$ : ''

  const fileName = `${fileNamePart}${hash}${fileExtension}`

  const fileUrl = `/${devFolder}/${rootFolder}/files/${folder}/${fileName}`
    // remove double slashes
    .replace(/\/\/+/g, '/')
    .replace(/^\//, '')

  return fileUrl
}

/** The key a pasted image is actually stored under. `getKey()` names the
 * upload; this names the object. They differ, and the route must return this
 * one — see `uploadFileFromRequest`. */
export const toTransformedKey = (key: string) => key.replace(/\.png$/, '.jpg')

// ---------------------------------------------------------------------------

let s3Client: S3Client | undefined

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({ region: AWS_REGION_NAME })
  }
  return s3Client
}

/** Reproduces `multer-s3-transform`'s `AUTO_CONTENT_TYPE`: magic bytes first,
 * then an SVG sniff, then a generic fallback.
 *
 * The XML guard is load-bearing. `AUTO_CONTENT_TYPE` ran `file-type@3`, which
 * detected no text formats at all, so the SVG sniff always got its turn. The
 * `file-type@16` we run here *does* detect XML, and an `application/xml`
 * verdict would shadow the sniff below — storing every SVG that carries an
 * `<?xml …?>` declaration (i.e. anything Illustrator or Inkscape exports) as
 * `application/xml`, which browsers refuse to render in an `<img>`. Bare
 * `<svg …>` files would keep working, so the breakage would look intermittent.
 *
 * Falling through to `application/octet-stream` rather than to `type.mime`
 * keeps non-SVG XML on the old stack's answer too. Verified against
 * `file-type@3.9.0` + `is-svg@2.1.0` from the Yarn cache: identical output on
 * every case tried. */
const detectContentType = async (body: Buffer): Promise<string> => {
  const type = await file_type.fromBuffer(body)
  if (type && type.mime !== 'application/xml') {
    return type.mime
  }
  if (isSvg(body)) {
    return 'image/svg+xml'
  }
  return 'application/octet-stream'
}

/** multer imposed no size limit of its own. `@fastify/multipart` otherwise
 * defaults `fileSize` to Fastify's 1MB `bodyLimit`, which would start
 * rejecting perfectly ordinary regulation images. */
const NO_FILE_SIZE_LIMIT = { limits: { fileSize: Infinity } }

/** The multipart field the upload must arrive under. */
const FILE_FIELD = 'file'

/** Reads the multipart `file` field off the request and stores it in S3,
 * returning the key it was written to — or `undefined` when the request
 * carried no such file, which the route turns into a 400.
 *
 * The whole file is buffered before anything is sent, because the MD5 of its
 * bytes is part of the object key: the key cannot be computed until the last
 * byte has arrived. That is deliberate, not an oversight — do not "optimise"
 * it into a straight-through stream.
 */
export const uploadFileFromRequest = async (
  request: FastifyRequest,
): Promise<UploadedFile | undefined> => {
  // `request.file()` throws FST_INVALID_MULTIPART_CONTENT_TYPE (406) on a
  // non-multipart body. Answering "no file arrived" the same way regardless of
  // why is both what the handler documents and what it always meant to do.
  if (!request.isMultipart()) {
    return undefined
  }

  const part: MultipartFile | undefined = await request.file(NO_FILE_SIZE_LIMIT)

  if (!part || part.fieldname !== FILE_FIELD) {
    return undefined
  }

  const body = await part.toBuffer()

  const hash = createHash('md5')
  // NOTE: hashing the latin1 *string* rather than the raw bytes is what the
  // shipped implementation did, and the first 8 hex characters of that digest
  // are baked into every key already in the bucket. Do not "correct" this.
  hash.update(body.toString('binary'))

  const file: UploadFileInfo = {
    originalname: part.filename,
    $hash$: hash.digest('hex').slice(0, 8),
  }

  // Side effect: this is where `file.isPasted` gets set.
  const key = getKey(request as KeyRequest, file)

  // Detected from the ORIGINAL bytes, exactly as `AUTO_CONTENT_TYPE` did —
  // so a transformed pasted image keeps its `image/png` content type even
  // though the stored body is JPEG. Pre-existing; every pasted image already
  // in the bucket looks like this.
  const contentType = await detectContentType(body)

  const transformed = !!file.isPasted
  const uploadKey = transformed ? toTransformedKey(key) : key
  const uploadBody = transformed
    ? await sharp(body)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 85 })
        .toBuffer()
    : body

  await new Upload({
    client: getS3Client(),
    params: {
      Bucket: AWS_BUCKET_NAME || '',
      Key: uploadKey,
      ACL: 'private',
      ContentType: contentType,
      StorageClass: 'STANDARD',
      Body: uploadBody,
    },
  }).done()

  return { key: uploadKey }
}
