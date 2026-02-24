import nodemailer, { SentMessageInfo } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { ONE_HOUR } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PresignedUrlResponse, S3UploadFileResponse } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'
import { getS3Bucket } from '@dmr.is/utils/server/serverUtils'

import { IAWSService } from './aws.service.interface'

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { SendRawEmailCommand, SESClient } from '@aws-sdk/client-ses'
import { fromIni } from '@aws-sdk/credential-providers'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const LOGGING_CATEGORY = 's3-service'

/**
 * Service class for interacting with the S3 bucket. Handles all S3-related operations.
 * For now it only handles uploads for the attachment bucket.
 * Maybe in the future add bucket as a parameter to the methods
 * @implements IAWSService
 */
@Injectable()
export class AWSService implements IAWSService {
  private readonly client = new S3Client({
    region: process.env.AWS_REGION ?? 'eu-west-1',
    credentials: process.env.AWS_CREDENTIALS_SOURCE
      ? fromIni({ profile: process.env.AWS_CREDENTIALS_SOURCE })
      : undefined,
  })

  private readonly ses = new SESClient({
    region: process.env.AWS_REGION ?? 'eu-west-1',
    credentials: process.env.AWS_CREDENTIALS_SOURCE
      ? fromIni({ profile: process.env.AWS_CREDENTIALS_SOURCE })
      : undefined,
  })

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    if (!this.client) {
      throw new Error(
        'Failed to create S3 client, check your AWS environment variables',
      )
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
    const isPdf = file.originalname.toLowerCase().endsWith('.pdf')
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ...(isPdf
        ? {
            ContentType: 'application/pdf',
            ContentDisposition: `inline; filename="${file.originalname}"`,
          }
        : {}),
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

  @LogAndHandle({ logArgs: false })
  async uploadObject(
    bucket: string,
    key: string,
    fileName: string,
    data: Buffer,
    hash?: string,
  ): Promise<ResultWrapper<string>> {
    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      Metadata: hash ? { hash } : undefined,
      ...(isPdf
        ? {
            ContentType: 'application/pdf',
            ContentDisposition: `inline; filename="${fileName}"`,
          }
        : {}),
    })

    this.logger.debug(
      `Uploading object to S3 bucket<${bucket}> with key<${key}>`,
      {
        category: LOGGING_CATEGORY,
        bucket,
        key,
        url: `${bucket}/${key}`,
      },
    )
    await this.client.send(command)

    const url = `${process.env.ADVERTS_CDN_URL}/${fileName}`

    return ResultWrapper.ok(url)
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
    const bucket = getS3Bucket()
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
   * Uploads a file to the S3 bucket.
   * @param bucket The bucket to upload to.
   * @param key The key to upload the file to.
   * @param file The file to upload.
   */
  @LogAndHandle()
  async replaceAdvertPdf(
    key: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>> {
    const bucket = getS3Bucket()
    const uploadResult = await this.uploadFile(bucket, key, file)

    return ResultWrapper.ok({
      ...uploadResult.unwrap(),
      url: `${process.env.ADVERTS_CDN_URL}`,
      filename: key,
    })
  }

  /**
   * Generates a presigned URL for a file in the S3 bucket.
   * Used in the application system to upload attachments.
   * @param key The key of the object to generate a presigned URL for.
   * @returns A presigned URL.
   */
  @LogAndHandle()
  async getPresignedUrl(
    key: string,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const bucket = getS3Bucket()

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const url = await getSignedUrl(this.client, command, {
      expiresIn: ONE_HOUR,
    })

    return ResultWrapper.ok({ url: url })
  }

  /**
   * Deletes an object from the S3 bucket.
   * @param key The key of the object to delete.
   */
  @LogAndHandle()
  async deleteObject(key: string): Promise<ResultWrapper> {
    const command = new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
    })

    await this.client.send(command)

    return ResultWrapper.ok()
  }

  /**
   * Fetches an object from key in S3 bucket
   * @param key key to which object to retrieve
   * @returns
   */
  @LogAndHandle()
  async getObject(key: string): Promise<ResultWrapper<string>> {
    const bucket = getS3Bucket()

    // check if key starts with slash
    if (key.startsWith('/')) {
      key = key.substring(1)
    }

    const fileName = key.split('/').pop()

    if (!fileName) {
      throw new InternalServerErrorException('Failed to get file name from key')
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    })

    const url = await getSignedUrl(this.client, command, {
      expiresIn: ONE_HOUR,
    })

    return ResultWrapper.ok(url)
  }

  /**
   * Fetches an object buffer based on key in S3 bucket
   * @param key key to which object to retrieve
   * @returns Buffer of the object
   */
  @LogAndHandle()
  async getObjectBuffer(
    key: string,
    s3Bucket?: string,
  ): Promise<ResultWrapper<Buffer>> {
    const bucket = s3Bucket || getS3Bucket()

    // check if key starts with slash
    if (key.startsWith('/')) {
      key = key.substring(1)
    }

    const fileName = key.split('/').pop()

    if (!fileName) {
      throw new InternalServerErrorException('Failed to get file name from key')
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    })
    const download = await this.client.send(command)

    if (!download.Body) {
      this.logger.error('Failed to get object body from S3', {
        category: LOGGING_CATEGORY,
        bucket,
        key,
      })
      throw new InternalServerErrorException('Failed to get object from S3')
    }

    const chunks: Uint8Array[] = []
    for await (const chunk of download.Body as any) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    return ResultWrapper.ok(buffer)
  }

  @LogAndHandle()
  async sendMail(message: Mail.Options, context = 'S3Service'): Promise<SentMessageInfo> {
    this.logger.info('Sending email with SES', {
      category: LOGGING_CATEGORY,
      context: context,
      to: message.to,
      subject: message.subject,
    })
    const transporter = nodemailer.createTransport({
      SES: { ses: this.ses, aws: { SendRawEmailCommand } },
    })
    return ResultWrapper.ok(await transporter.sendMail(message))
  }
}
