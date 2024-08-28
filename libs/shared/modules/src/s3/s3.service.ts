import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ONE_HOUR } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { getApplicationBucket } from '@dmr.is/utils'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { IS3Service } from './s3.service.interface'

/**
 * Service class for interacting with the S3 bucket. Handles all S3-related operations.
 * For now it only handles uploads for the attachment bucket.
 * Maybe in the future add bucket as a parameter to the methods
 * @implements IS3Service
 */
@Injectable()
export class S3Service implements IS3Service {
  private readonly client = new S3Client({
    region: process.env.AWS_REGION ?? 'eu-west-1',
  })
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    if (!this.client) {
      throw new Error(
        'Failed to create S3 client, check your AWS environment variables',
      )
    }
  }

  private async isAlive() {
    try {
      // some command to check if connection is alive
      await this.client.send(new ListBucketsCommand())
      return true
    } catch (error) {
      this.logger.error('Failed to connect to S3', error)
      return false
    }
  }

  /**
   * Responsible for aborting an upload to the S3 bucket.
   * @param bucket The bucket to abort the upload
   * @param key The key to abort the upload
   * @param uploadId The upload ID to abort
   */
  @LogAndHandle()
  private async abortUpload(
    bucket: string,
    key: string,
    uploadId?: string,
  ): Promise<ResultWrapper> {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    })

    await this.client.send(command)

    return ResultWrapper.ok()
  }

  /**
   * Handles the upload of a file to the S3 bucket.
   * Used for admin system to upload attachments.
   * @param bucket What bucket to store the attachment
   * @param key The key to store the attachment
   * @param file The file that was uploaded
   * @returns
   */
  @LogAndHandle()
  private async uploadFile(
    bucket: string,
    key: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>> {
    const isAlive = await this.isAlive()

    if (!isAlive) {
      this.logger.error('Connection to S3 lost')
      throw new InternalServerErrorException()
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
    })

    const multipartUpload = await this.client.send(command)
    if (!multipartUpload.UploadId) {
      await this.abortUpload(bucket, key, multipartUpload.UploadId)

      throw new InternalServerErrorException(
        'Failed to create multipart upload',
      )
    }

    const uploadPromises = []
    const chunkSize = 5 * 1024 * 1024
    const chunks = Math.ceil(file.size / chunkSize)

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)

      const part = file.buffer.subarray(start, end)

      const partCommand = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        PartNumber: i + 1,
        UploadId: multipartUpload.UploadId,
        Body: part,
      })

      uploadPromises.push(this.client.send(partCommand))
    }

    const uploadResults = await Promise.all(uploadPromises)

    const results = await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: multipartUpload.UploadId,
        MultipartUpload: {
          Parts: uploadResults.map((part, index) => ({
            ETag: part.ETag,
            PartNumber: index + 1,
          })),
        },
      }),
    )

    if (!results.Location) {
      await this.abortUpload(bucket, key, multipartUpload.UploadId)

      this.logger.debug(
        `Failed to complete multipart upload for file<${key}> in bucket<${bucket}>`,
      )
      throw new InternalServerErrorException(
        'Failed to complete multipart upload',
      )
    }

    return ResultWrapper.ok({
      url: results.Location,
      filename: file.originalname,
      size: file.size,
    })
  }

  /**
   * Uploads an attachment sent from the application system to S3 bucket.
   * @param applicationId The ID of the application.
   * @param files The files to upload.
   */
  @LogAndHandle()
  async uploadApplicationAttachments(
    applicationId: string,
    files: Array<Express.Multer.File>,
  ): Promise<ResultWrapper<Array<S3UploadFileResponse>>> {
    const bucket = getApplicationBucket()
    const now = new Date().toISOString()
    const promises = files.map((file) => {
      const key = `applications/${applicationId}/${now}-${file.originalname}`
      return this.uploadFile(bucket, key, file)
    })

    const results = await Promise.all(promises)

    const unwrappedResults = results.map((result) => result.unwrap())

    // const fileCheck = await this.doesFileExist(bucket, key)

    // by default aws will overwrite file if it exists
    // skipping handling of file existence for now

    return ResultWrapper.ok(unwrappedResults)
  }

  /**
   * Generates a presigned URL for a file in the S3 bucket.
   * Used in the application system to upload attachments.
   * @param key The key of the object to generate a presigned URL for.
   * @returns A presigned URL.
   */
  @LogAndHandle()
  async getPresignedUrl(key: string): Promise<ResultWrapper<string>> {
    const isAlive = await this.isAlive()

    if (!isAlive) {
      this.logger.error('Connection to S3 lost')
      throw new InternalServerErrorException()
    }

    const bucket = getApplicationBucket()

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const data = await getSignedUrl(this.client, command, {
      expiresIn: ONE_HOUR,
    })

    return ResultWrapper.ok(data)
  }

  /**
   * Deletes an object from the S3 bucket.
   * @param key The key of the object to delete.
   */
  @LogAndHandle()
  async deleteObject(key: string): Promise<ResultWrapper> {
    const command = new DeleteObjectCommand({
      Bucket: getApplicationBucket(),
      Key: key,
    })

    await this.client.send(command)

    return ResultWrapper.ok()
  }
}
