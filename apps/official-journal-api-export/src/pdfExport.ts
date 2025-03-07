/* eslint-disable no-console */
import { hrtime } from 'process'
import { getEnv } from './lib/environment'
import {
  S3Client,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { Document } from './types'
import { readdirSync, readFileSync } from 'node:fs'
import { File } from 'node:buffer'
import { join, relative } from 'node:path'

const ROOT_Files_DIR = './apps/official-journal-api-export/files'

async function exec<T = unknown>(
  action: string,
  fn: () => Promise<T>,
  emoji = '⏰',
) {
  log(`${emoji} starting ${action}`)
  const start = hrtime.bigint()
  const result = await fn()
  const end = hrtime.bigint()

  const elapsedInSec = (Number(end - start) / 1e9).toFixed(2)

  const lengtString = Array.isArray(result) ? ` (${result.length} records)` : ''

  log(`${emoji} finished ${action} in ${elapsedInSec} seconds${lengtString}`)
  return result
}
function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(message)
}

async function readFilesRecursively(
  dir: string,
  baseDir: string,
): Promise<{ key: string; file: Buffer }[]> {
  const filesToReturn = []
  const files = await readdirSync(dir, { withFileTypes: true })
  //remove DS_STORE folder
  if (files[0].name === '.DS_Store') {
    files.shift()
  }
  for (const file of files) {
    const fullPath = join(dir, file.name)
    if (file.isDirectory()) {
      filesToReturn.push(...(await readFilesRecursively(fullPath, baseDir)))
    } else {
      const relativePath = relative(baseDir, fullPath)
      filesToReturn.push({
        key: `collections/${relativePath}`,
        file: await readFileSync(fullPath),
      })
    }
  }
  return filesToReturn
}

export async function getAdvertDocuments(): Promise<boolean> {
  //find folder in path
  //read all files in folder
  //return files
  const files = await readFilesRecursively(ROOT_Files_DIR, ROOT_Files_DIR)
  await savePDF(files)
  return true
}

async function main() {
  const env = getEnv()
  const test = await exec('testing advert documents', getAdvertDocuments)
}

async function savePDF(files: { key: string; file: Buffer }[]) {
  const client = new S3Client({
    region: 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
    },
  })
  if (!client) {
    throw new Error('S3 client not initialized')
  }

  const bucket = 'official-journal-application-files-bucket-dev'

  for await (const file of files) {
    const key = file.key

    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      const fileCheck = await client.send(command)
      //console.log(`File exists: ${key}`)
      //console.log(`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`)
      return `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`
      //https://official-journal-application-files-bucket-dev.s3.eu-west-1.amazonaws.com/adverts/A_nr_1_2006.pdf
    } catch (error: any) {
      console.log(`File does not exist: ${key}, let upload`)
    }

    let uploadId
    const buffer = file.file
    try {
      const multipartUpload = await client.send(
        new CreateMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
        }),
      )

      uploadId = multipartUpload.UploadId

      const uploadPromises = []
      // Multipart uploads require a minimum size of 5 MB per part.
      const chunkSize = 1024 * 1024 * 5
      const numberOfparts = Math.ceil(buffer.length / chunkSize)

      // Upload each part.
      for (let i = 0; i < numberOfparts; i++) {
        const start = i * chunkSize
        const end = start + chunkSize
        uploadPromises.push(
          client
            .send(
              new UploadPartCommand({
                Bucket: bucket,
                Key: key,
                UploadId: uploadId,
                Body: buffer.subarray(start, end),
                PartNumber: i + 1,
              }),
            )
            .then((d) => {
              return d
            }),
        )
      }

      const uploadResults = await Promise.all(uploadPromises)

      const res = await client.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: uploadResults.map(({ ETag }, i) => ({
              ETag,
              PartNumber: i + 1,
            })),
          },
        }),
      )

      return res.Location
    } catch (err) {
      console.log('Error uploading parts', err)
      if (uploadId) {
        const res = await client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
          }),
        )
      }
      return null
    }
  }
}

// eslint-disable-next-line no-console
main().catch(console.error)
