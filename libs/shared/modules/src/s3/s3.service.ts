import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListBucketsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { IS3Service } from './s3.service.interface'

/**
 * Service class for interacting with the S3 bucket. Handles all S3-related operations.
 * @implements IS3Service
 */
@Injectable()
export class S3Service implements IS3Service {
  private readonly client = new S3Client({
    region: 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
    },
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

  private async abortUpload(bucket: string, key: string, uploadId?: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    })

    await this.client.send(command)
  }

  // private async doesFileExist(bucket: string, key: string): Promise<boolean> {
  //   try {
  //     const command = new HeadObjectCommand({
  //       Bucket: bucket,
  //       Key: key,
  //     })

  //     await this.client.send(command)

  //     return true
  //   } catch (error) {
  //     this.logger.debug(`File<${key}> not found in bucket<${bucket}>`, error)
  //     return false
  //   }
  // }

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
    const bucket = 'official-journal-application-files-bucket-dev'

    const promises = files.map((file) => {
      const key = `applications/${applicationId}/${file.originalname}`
      return this.uploadFile(bucket, key, file)
    })

    const results = await Promise.all(promises)

    const unwrappedResults = results.map((result) => result.unwrap())

    // const fileCheck = await this.doesFileExist(bucket, key)

    // by default aws will overwrite file if it exists
    // skipping handling of file existence for now

    return ResultWrapper.ok(unwrappedResults)
  }
}
