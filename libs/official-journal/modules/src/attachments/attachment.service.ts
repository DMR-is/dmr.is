import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetApplicationAttachmentResponse,
  GetApplicationAttachmentsResponse,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { attachmentMigrate } from './migrations/attachment.migration'
import {
  type CreateAttachmentParams,
  IAttachmentService,
} from './attachment.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentsModel,
  ApplicationAttachmentTypeModel,
  CaseAttachmentsModel,
} from './models'

@Injectable()
export class AttachmentService implements IAttachmentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationAttachmentModel)
    private readonly applicationAttachmentModel: typeof ApplicationAttachmentModel,
    @InjectModel(ApplicationAttachmentsModel)
    private readonly applicationAttachmentsModel: typeof ApplicationAttachmentsModel,
    @InjectModel(ApplicationAttachmentTypeModel)
    private readonly applicationAttachmentTypeModel: typeof ApplicationAttachmentTypeModel,

    @InjectModel(CaseAttachmentsModel)
    private readonly caseAttachmentsModel: typeof CaseAttachmentsModel,

    private sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  async attachmentTypeLookup(
    type: AttachmentTypeParam,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationAttachmentTypeModel>> {
    const found = await this.applicationAttachmentTypeModel.findOne({
      where: {
        slug: type,
      },
      transaction: transaction,
    })

    if (!found) {
      throw new NotFoundException(`AttachmentType<${type}> not found`)
    }

    return ResultWrapper.ok(found)
  }

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
  async createAttachment({
    params,
    transaction,
  }: CreateAttachmentParams): Promise<ResultWrapper<{ id: string }>> {
    ResultWrapper.unwrap(
      await this.handleReUpload(
        params.applicationId,
        params.body.originalFileName,
        transaction,
      ),
    )

    const foundAttachmentType = (
      await this.attachmentTypeLookup(params.attachmentType, transaction)
    ).unwrap()

    const attachment = await this.applicationAttachmentModel.create(
      {
        applicationId: params.applicationId,
        originalFileName: params.body.originalFileName,
        fileName: params.body.originalFileName,
        fileFormat: params.body.fileFormat,
        fileExtension: params.body.fileExtension,
        fileSize: params.body.fileSize,
        fileLocation: params.body.fileLocation,
        deleted: false,
        typeId: foundAttachmentType.id,
      },
      {
        transaction: transaction,
        returning: true,
      },
    )

    await this.applicationAttachmentsModel.create(
      {
        applicationId: params.applicationId,
        attachmentId: attachment.id,
      },
      {
        transaction: transaction,
      },
    )

    if (params.caseId) {
      await this.caseAttachmentsModel.create(
        {
          caseId: params.caseId,
          attachmentId: attachment.id,
        },
        {
          transaction: transaction,
        },
      )
    }

    return ResultWrapper.ok({ id: attachment.id })
  }

  /**
   * Used when users remove the attachment from the file inputs
   * @param key deletes an attachment by id
   * @param transaction
   * @returns
   */
  @LogAndHandle()
  @Transactional()
  async deleteAttachmentByKey(
    applicationId: string,
    key: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const found = await this.applicationAttachmentModel.findOne({
      where: {
        applicationId: applicationId,
        fileLocation: key,
        deleted: false,
      },
      transaction: transaction,
    })

    if (!found) {
      throw new NotFoundException(`Attachment with location<${key}> not found`)
    }

    await found.update(
      {
        deleted: true,
      },
      { transaction: transaction },
    )

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
      include: [ApplicationAttachmentTypeModel],
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
  async getApplicationAttachment(
    applicationId: string,
    typeId?: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse | null>> {
    const found = await this.applicationAttachmentModel.findOne({
      where: {
        applicationId: applicationId,
        ...(typeId ? { typeId } : {}),
        deleted: false,
      },
      include: [ApplicationAttachmentTypeModel],
      transaction: transaction,
    })

    if (!found) {
      return ResultWrapper.ok(null)
    }

    const attachment = attachmentMigrate(found)

    return ResultWrapper.ok({
      attachment: attachment,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentResponse>> {
    const found = await this.caseAttachmentsModel.findOne({
      where: {
        caseId: caseId,
        attachmentId: attachmentId,
      },
      include: [
        {
          model: ApplicationAttachmentModel,
          where: { deleted: false },
          include: [ApplicationAttachmentTypeModel],
        },
      ],
      transaction: transaction,
    })

    if (!found) {
      throw new NotFoundException(`Attachment<${attachmentId}> not found`)
    }

    const attachment = attachmentMigrate(found.attachment)

    return ResultWrapper.ok({
      attachment: attachment,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getAttachments(
    applicationId: string,
    type: AttachmentTypeParam,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>> {
    const typeLookup = (
      await this.attachmentTypeLookup(type, transaction)
    ).unwrap()

    const found = await this.applicationAttachmentModel.findAll({
      where: {
        applicationId: applicationId,
        typeId: typeLookup.id,
        deleted: false,
      },
      include: [ApplicationAttachmentTypeModel],
      transaction: transaction,
    })

    const attachments = found.map((attachment) => attachmentMigrate(attachment))

    return ResultWrapper.ok({
      attachments: attachments,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getAllAttachments(
    applicationId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationAttachmentsResponse>> {
    const found = await this.applicationAttachmentModel.findAll({
      where: {
        applicationId: applicationId,
        deleted: false,
      },
      include: [ApplicationAttachmentTypeModel],
      transaction: transaction,
    })

    const attachments = found.map((attachment) => attachmentMigrate(attachment))

    return ResultWrapper.ok({
      attachments: attachments,
    })
  }

  @LogAndHandle()
  @Transactional()
  async createCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseAttachmentsModel.create(
      {
        caseId: caseId,
        attachmentId: attachmentId,
      },
      {
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }
}
