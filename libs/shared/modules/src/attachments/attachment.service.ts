import { Transaction } from 'sequelize'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
  PostApplicationAttachmentBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { attachmentMigrate } from './migrations/attachment.migration'
import { IAttachmentService } from './attachment.service.interface'
import { ApplicationAttachmentModel } from './models'

@Injectable()
export class AttachmentService implements IAttachmentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationAttachmentModel)
    private applicationAttachmentModel: typeof ApplicationAttachmentModel,
    @InjectModel(ApplicationAttachmentModel)
    private applicationAttachmentsModel: typeof ApplicationAttachmentModel,
  ) {}

  /**
   * We need to mark db records as deleted if an object with the same name/key exists in the S3 bucket.
   * Because S3 will overwrite the file with the same name/key.
   * @param applicationId Id of the application
   * @param originalFileName Original file name
   * @param transaction
   * @returns
   */
  @LogAndHandle()
  @Transactional()
  private async handleReUpload(
    applicationId: string,
    originalFileName: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const now = new Date().toISOString()
    const existingAttachment = await this.applicationAttachmentModel.findOne({
      where: {
        applicationId: applicationId,
        originalFileName: originalFileName,
        deleted: false,
      },
      transaction: transaction,
    })

    if (existingAttachment) {
      this.logger.info(
        `Attachment with originalFileName<${originalFileName}> already exists for applicationId<${applicationId}>, marking as deleted`,
      )
      await existingAttachment.update(
        {
          fileName: `deleted_${now}_${originalFileName}`,
          deleted: true,
        },
        { transaction: transaction },
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createAttachment(
    applicationId: string,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    ResultWrapper.unwrap(
      await this.handleReUpload(
        applicationId,
        body.originalFileName,
        transaction,
      ),
    )

    const id = uuid()
    const newAttachment = await this.applicationAttachmentModel.create(
      {
        id: id,
        applicationId: applicationId,
        originalFileName: body.originalFileName,
        fileName: body.fileName,
        fileFormat: body.fileFormat,
        fileExtension: body.fileExtension,
        fileLocation: body.fileLocation,
        fileSize: body.fileSize,
        deleted: false,
      },
      { transaction: transaction },
    )

    await this.applicationAttachmentsModel.create(
      {
        applicationId: applicationId,
        attachmentId: newAttachment.id,
      },
      {
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async deleteAttachment(
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.applicationAttachmentModel.update(
      { deleted: true },
      {
        where: {
          id: attachmentId,
        },
        returning: ['applicationId'],
        transaction: transaction,
      },
    )

    await this.applicationAttachmentsModel.destroy({
      where: {
        attachmentId: attachmentId,
      },
      transaction: transaction,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async getAttachment(
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse>> {
    const found = await this.applicationAttachmentModel.findOne({
      where: {
        id: attachmentId,
        deleted: false,
      },
      transaction: transaction,
    })

    if (!found) {
      throw new NotFoundException(`Attachment<${attachmentId}> not found`)
    }

    const attachment = attachmentMigrate(found)

    return ResultWrapper.ok({
      attachment: attachment,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getAttachments(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>> {
    const found = await this.applicationAttachmentModel.findAll({
      where: {
        applicationId: applicationId,
        deleted: false,
      },
      transaction: transaction,
    })

    const attachments = found.map((attachment) => attachmentMigrate(attachment))

    return ResultWrapper.ok({
      attachments: attachments,
    })
  }
}