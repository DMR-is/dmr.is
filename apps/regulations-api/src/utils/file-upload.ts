import S3 from 'aws-sdk/clients/s3'
import { createHash } from 'crypto'
import type { Request as ExpressRequest } from 'express'
import multer from 'fastify-multer'
import multerS3 from 'multer-s3-transform'
import sharp from 'sharp'
import { Readable } from 'stream'

import { ensureRegName, nameToSlug } from '@island.is/regulations-tools/utils'

import {
  AWS_BUCKET_NAME,
  AWS_REGION_NAME,
  DRAFTS_FOLDER,
  MEDIA_BUCKET_FOLDER,
} from '../constants'
import { ensureFileScopeToken, ensureUploadTypeHeader } from './misc'

// `multer-s3-transform` doesn't have TypeScript definitions, so we just make do with this
// copied over from https://www.npmjs.com/package/multer-s3-transform#file-information
type MulterFile = Omit<
  Express.Multer.File,
  'filename' | 'destination' | 'path' | 'buffer' | 'stream'
>

export type MulterS3StorageFile = MulterFile & {
  /** The bucket used to store the file */
  bucket: string
  /** The name of the file */
  key: string
  /** Access control for the file */
  acl: string
  /** The mimetype used to upload the file */
  contentType: string
  /** The metadata object to be sent to S3 */
  metadata: string
  /** The S3 url to access the file */
  location: string
  /** The etagof the uploaded file in S3 */
  etag: string
  /** The contentDisposition used to upload the file */
  contentDisposition: string
  /** The storageClass to be used for the uploaded file in S3 */
  storageClass: string
  /** The versionId is an optional param returned by S3 for versioned buckets. */
  versionId: string
}

type MulterFileWithHash = MulterFile & {
  $hash$?: string
  isPasted?: boolean
  key?: string
}

const getSingleQuery = (req: ExpressRequest, param: string): string => {
  let value = req.query[param] as string | Array<string> | undefined
  if (value && typeof value !== 'string') {
    value = value[0]
  }
  return value || ''
}

const getKey = (req: ExpressRequest, _file: MulterFile) => {
  const file = _file as MulterFileWithHash
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

const storage = multerS3({
  s3: new S3({ region: AWS_REGION_NAME }),
  bucket: AWS_BUCKET_NAME || '',
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    cb(null, getKey(req as ExpressRequest, file))
  },
  // See also: https://www.npmjs.com/package/multer-s3-transform#transforming-files-before-upload
  // @ts-expect-error  (multer-s3-transform has no .d.ts files)
  shouldTransform: function (req, file: MulterFileWithHash, cb) {
    // cb(null, false); // no transforming for the time being. Deafult to all pasted files being just bulky PNG
    cb(null, file.isPasted)
  },
  transforms: [
    {
      id: 'original',
      key: (
        req: ExpressRequest,
        file: MulterFileWithHash,
        // @ts-expect-error  (multer-s3-transform has no .d.ts files)
        cb,
      ) => {
        cb(null, getKey(req, file).replace(/\.png$/, '.jpg'))
      },
      // @ts-expect-error  (multer-s3-transform has no .d.ts files)
      transform: (req: Request, file, cb) => {
        cb(
          null,
          sharp().flatten({ background: '#ffffff' }).jpeg({ quality: 85 }),
        )
      },
    },
    // {
    //   id: 'webp nearLossless',
    //   // @ts-expect-error  (multer-s3-transform has no .d.ts files)
    //   key: (req: Request, file: MulterFileWithHash, cb) => {
    //     cb(null, getKey(req, file).replace(/\.png$/, '-nll.webp'));
    //   },
    //   // @ts-expect-error  (multer-s3-transform has no .d.ts files)
    //   transform: (req: Request, file, cb) => {
    //     cb(null, sharp().webp({ quality: 85, nearLossless: true }));
    //   },
    // },
    // {
    //   id: 'webp lossy',
    //   // @ts-expect-error  (multer-s3-transform has no .d.ts files)
    //   key: (req: Request, file: MulterFileWithHash, cb) => {
    //     cb(null, getKey(req, file).replace(/\.png$/, '.webp'));
    //   },
    //   // @ts-expect-error  (multer-s3-transform has no .d.ts files)
    //   transform: (req: Request, file, cb) => {
    //     cb(null, sharp().webp({ quality: 85 }));
    //   },
    // },
  ],
})

const multerS3_handleFile = storage._handleFile
storage._handleFile = function (req, file, cb) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const _this = this
  const hash = createHash('md5')
  const fileData: Array<Buffer> = []
  file.stream
    .on('data', (data: Buffer) => {
      hash.update(data.toString('binary'))
      fileData.push(data)
    })
    .on('end', () => {
      const $hash$ = hash.digest('hex').slice(0, 8)
      multerS3_handleFile.call(
        _this,
        req,
        {
          ...file,
          $hash$,
          stream: Readable.from(fileData),
        },
        cb,
      )
    })
}

export const fileUploader = multer({
  // @ts-expect-error  (multer-s3-transform assumes Express.js-branded Response/Request objects)
  storage,
}).single('file')
