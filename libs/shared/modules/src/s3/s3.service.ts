import { extension } from 'mime-types'
import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuidv4 } from 'uuid'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { APPLICATION_FILES_BUCKET, ONE_HOUR } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ApplicationAttachment, S3UploadFileResponse } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { createApplicationKey, getApplicationBucket } from '@dmr.is/utils'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  ApplicationAttachmentModel,
  ApplicationAttachmentsModel,
} from './models'
import { IS3Service } from './s3.service.interface'

/**
 * Service class for interacting with the S3 bucket. Handles all S3-related operations.
 * @implements IS3Service
 */
@Injectable()
export class S3Service implements IS3Service {
  private readonly client = new S3Client({
    region: process.env.AWS_REGION ?? 'eu-west-1',
  })
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationAttachmentModel)
    private readonly applicationAttachmentModel: typeof ApplicationAttachmentModel,

    @InjectModel(ApplicationAttachmentsModel)
    private readonly applicationAttachmentsModel: typeof ApplicationAttachmentsModel,

    private readonly sequelize: Sequelize,
  ) {
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
   * Responsible for database interaction when saving an attachment.
   * @param attachment the attachment to save
   * @param transaction transaction to use
   * @returns
   */
  @LogAndHandle()
  @Transactional()
  private async saveApplicationAttachment(
    attachment: ApplicationAttachment,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const now = new Date().toISOString()
    //check if attachment already exists
    const existingAttachment = await this.applicationAttachmentModel.findOne({
      where: {
        applicationId: attachment.applicationId,
        originalFileName: attachment.originalFileName,
        deleted: false,
      },
      transaction: transaction,
    })

    // rename old attachment and mark as deleted
    if (existingAttachment) {
      await existingAttachment.update(
        {
          fileName: `deleted_${now}_${attachment.originalFileName}`,
          deleted: true,
        },
        { transaction: transaction },
      )
    }

    const fileNameWithoutExtension = attachment.originalFileName
      .split('.')
      .slice(0, -1)
      .join('.')

    const fileName = `${now}-${fileNameWithoutExtension}.${attachment.fileExtension}`

    const newAttachment = await this.applicationAttachmentModel.create(
      {
        id: attachment.id,
        applicationId: attachment.applicationId,
        originalFileName: attachment.originalFileName,
        fileName: fileName,
        fileFormat: attachment.fileFormat,
        fileExtension: attachment.fileExtension,
        fileLocation: attachment.fileLocation,
        fileSize: attachment.fileSize,
        deleted: false,
      },
      { transaction: transaction, returning: ['id'] },
    )

    await this.applicationAttachmentsModel.create(
      {
        attachmentId: newAttachment.id,
        applicationId: attachment.applicationId,
      },
      { transaction: transaction },
    )

    return ResultWrapper.ok()
  }

  /**
   * Handles the upload of a file to the S3 bucket.
   * @param bucket What bucket to store the attachment
   * @param key The key to store the attachment
   * @param applicationId The application ID of the attachment
   * @param file The file that was uploaded
   * @returns
   */
  @LogAndHandle()
  private async uploadFile(
    bucket: string,
    key: string,
    applicationId: string,
    file: Express.Multer.File,
  ): Promise<ResultWrapper<S3UploadFileResponse>> {
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

    const fileExtension = extension(file.mimetype)

    if (!fileExtension) {
      throw new BadRequestException('Failed to get file extension')
    }

    try {
      ResultWrapper.unwrap(
        await this.saveApplicationAttachment({
          id: uuidv4(),
          applicationId: applicationId,
          fileName: file.originalname,
          originalFileName: file.originalname,
          fileFormat: file.mimetype,
          fileExtension: fileExtension,
          fileLocation: results.Location,
          fileSize: file.size,
          deleted: false,
        }),
      )
    } catch (error) {
      ResultWrapper.unwrap(
        await this.abortUpload(bucket, key, multipartUpload.UploadId),
      )
      throw new InternalServerErrorException()
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
      return this.uploadFile(bucket, key, applicationId, file)
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
   */
  @LogAndHandle()
  async getPresignedUrl(
    applicationId: string,
    fileName: string,
    fileType: string,
    isOriginal = false,
  ): Promise<ResultWrapper<string>> {
    const bucket = getApplicationBucket()

    const key = createApplicationKey(
      applicationId,
      isOriginal,
      fileName,
      fileType,
    )

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const data = await getSignedUrl(this.client, command, {
      expiresIn: ONE_HOUR,
    })

    return ResultWrapper.ok(data)
  }
}
