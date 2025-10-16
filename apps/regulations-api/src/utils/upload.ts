import {
  AWS_BUCKET_NAME,
  AWS_PRESIGNED_POST_EXPIRES,
  AWS_REGION_NAME,
  MEDIA_BUCKET_FOLDER,
} from '../constants'
import { ensureFileScopeToken } from './misc'

import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { Conditions } from '@aws-sdk/s3-presigned-post/dist-types/types'

export type S3PresignedPost = {
  url: string
  fields: { [key: string]: string }
}

const _generateFileKey = (
  name?: string,
  rootFolder?: string,
  folderToken?: string,
  hash?: string,
) => {
  const folder = ensureFileScopeToken(folderToken)

  const devFolder = MEDIA_BUCKET_FOLDER || ''

  if (!name) {
    return
  }

  const originalName =
    name
      .split('/')
      .pop()
      // normalized names of pasted blobs
      ?.replace(/^blobid\d+.png$/, 'pasted--image.png') || ''
  let fileNamePart = originalName.replace(/\.[^.]+$/, '')
  const fileExtension = originalName.slice(fileNamePart.length).toLowerCase()
  if (/^pasted--image/.test(fileNamePart)) {
    fileNamePart = fileNamePart.replace(/^pasted--/, '')
  }
  const fileHash = hash ? '--' + hash : ''

  const fileName = `${fileNamePart}${fileHash}${fileExtension}`

  const fileUrl = `/${devFolder}/${rootFolder}/files/${folder}/${fileName}`
    // remove double slashes
    .replace(/\/\/+/g, '/')
    .replace(/^\//, '')

  return fileUrl
}

export const createPresigned = async (
  fileName: string,
  rootFolder?: string,
  folderToken?: string,
  hash?: string,
): Promise<S3PresignedPost | null> => {
  const client = new S3Client({ region: AWS_REGION_NAME })
  const key = _generateFileKey(fileName, rootFolder, folderToken, hash)

  if (!key) {
    // eslint-disable-next-line no-console
    console.error('failed to create key')
    return null
  }

  const conditions: Array<Conditions> = [{ bucket: AWS_BUCKET_NAME }]
  const expires = AWS_PRESIGNED_POST_EXPIRES
  const presignedPostOptions = {
    Bucket: AWS_BUCKET_NAME,
    Key: key,
    Conditions: conditions,
    Expires: expires,
  }

  try {
    const { url, fields } = await createPresignedPost(
      client,
      presignedPostOptions,
    )

    return {
      url,
      fields,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : error
    // eslint-disable-next-line no-console
    console.error('⚠️ ', message)
    return null
  }
}
// ===========================================================================
