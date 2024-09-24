import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { REYKJAVIKUR_BORG } from '@dmr.is/mocks'
import {
  Application,
  CaseCommentTypeEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CaseTagEnum,
  CreateCaseChannelBody,
  PostApplicationBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import {
  getFastTrack,
  getSignatureBody,
  handleException,
  withTransaction,
} from '@dmr.is/utils'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../../../application/application.service.interface'
import { IAttachmentService } from '../../../attachments/attachment.service.interface'
import { ICommentService } from '../../../comment/comment.service.interface'
import { ISignatureService } from '../../../signature/signature.service.interface'
import { IUtilityService } from '../../../utility/utility.module'
import {
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseModel,
} from '../../models'
import { ICaseCreateService } from './case-create.service.interface'

const LOGGING_CATEGORY = 'CaseCreateService'

@Injectable()
export class CaseCreateService implements ICaseCreateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IAttachmentService)
    private readonly attachmentService: IAttachmentService,
    @Inject(ISignatureService)
    private readonly signatureService: ISignatureService,
    @Inject(ICommentService) private readonly commentService: ICommentService,
    @InjectModel(CaseChannelModel)
    private readonly caseChannelModel: typeof CaseChannelModel,
    @InjectModel(CaseChannelsModel)
    private readonly caseChannelsModel: typeof CaseChannelsModel,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  private async getCreateCaseBody(
    application: Application,
    transaction?: Transaction,
  ) {
    const now = new Date()
    const caseId = uuid()

    const caseStatus = ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Submitted),
    )

    const caseTag = ResultWrapper.unwrap(
      await this.utilityService.caseTagLookup(CaseTagEnum.NotStarted),
    )

    const caseCommunicationStatus = ResultWrapper.unwrap(
      await this.utilityService.caseCommunicationStatusLookup(
        CaseCommunicationStatus.NotStarted,
      ),
    )

    const internalCaseNumber = ResultWrapper.unwrap(
      await this.utilityService.generateInternalCaseNumber(),
    )

    const type = ResultWrapper.unwrap(
      await this.utilityService.typeLookup(
        application.answers.advert.typeId,
        transaction,
      ),
    )

    const department = ResultWrapper.unwrap(
      await this.utilityService.departmentLookup(
        application.answers.advert.departmentId,
        transaction,
      ),
    )

    const categoriesLookup = application.answers.advert.categories.map(
      async (category) => {
        try {
          const lookup = ResultWrapper.unwrap(
            await this.utilityService.categoryLookup(category),
          )

          return {
            caseId: caseId,
            categoryId: lookup.id,
          }
        } catch (e) {
          this.logger.warn(
            `Uknown category<${category}> found in application`,
            {
              category: LOGGING_CATEGORY,
              categoryId: category,
            },
          )

          return null
        }
      },
    )

    const categories = (await Promise.all(categoriesLookup)).filter(
      (category) => category !== null,
    )

    const channels = application.answers.advert.channels?.map((channel) => {
      return {
        email: channel.email,
        phone: channel.phone,
      }
    })

    const signatureType = application.answers.misc.signatureType
    const signature = application.answers.signatures[signatureType]

    if (!signature) {
      this.logger.warn(
        `CaseService.createCase<${caseId}>: No signature found for signatureType<${signatureType}>`,
      )

      throw new BadRequestException('Signature is missing')
    }

    const additionalSignature =
      application.answers.signatures.additionalSignature !== undefined
        ? application.answers.signatures.additionalSignature[signatureType]
        : undefined

    const signatureBody = Array.isArray(signature)
      ? signature.map((signature) =>
          getSignatureBody(caseId, signature, additionalSignature),
        )
      : [getSignatureBody(caseId, signature, additionalSignature)]

    const requestedDate = application.answers.advert.requestedDate
    const { fastTrack } = getFastTrack(new Date(requestedDate))
    const involvedParty = { id: 'e5a35cf9-dc87-4da7-85a2-06eb5d43812f' } // dómsmálaráðuneytið
    const message = application.answers.advert.message

    return ResultWrapper.ok({
      caseBody: {
        id: caseId,
        applicationId: application.id,
        year: now.getFullYear(),
        caseNumber: internalCaseNumber,
        statusId: caseStatus.id,
        tagId: caseTag.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isLegacy: false,
        assignedUserId: null,
        communicationStatusId: caseCommunicationStatus.id,
        publishedAt: null,
        price: 0,
        paid: false,
        involvedPartyId: involvedParty.id,
        fastTrack: fastTrack,
        advertTitle: application.answers.advert.title,
        requestedPublicationDate: requestedDate,
        departmentId: department.id,
        advertTypeId: type.id,
        html: application.answers.advert.html,
        message: message,
      },
      categories: categories,
      channels: channels,
      signature: signatureBody,
    })
  }

  @LogAndHandle()
  @Transactional()
  async createCaseCategory(
    caseId: string,
    categoryId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseCategoriesModel.create(
      {
        caseId,
        categoryId,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const channel = await this.caseChannelModel.create(
      {
        email: body.email,
        phone: body.phone,
      },
      {
        returning: ['id'],
        transaction,
      },
    )

    await this.caseChannelsModel.create(
      {
        caseId,
        channelId: channel.id,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async createCase(body: PostApplicationBody): Promise<ResultWrapper> {
    // case does not exist so we can create it
    const { application } = (
      await this.applicationService.getApplication(body.applicationId)
    ).unwrap()

    this.logger.debug('Getting create case body')
    const values = ResultWrapper.unwrap(
      await this.getCreateCaseBody(application),
    )

    let caseId = null

    try {
      this.logger.debug('Creating case')
      const newId = ResultWrapper.unwrap(
        await withTransaction<string>(this.sequelize)(async (transaction) => {
          const newCase = await this.caseModel.create(
            {
              ...values.caseBody,
            },
            {
              returning: ['id'],
              transaction: transaction,
            },
          )

          return ResultWrapper.ok(newCase.id)
        }),
      )

      caseId = newId
    } catch (error) {
      // returning the error since creation of the case is vital for the process
      return handleException({
        method: 'createCase',
        message: 'Error creating case',
        category: LOGGING_CATEGORY,
        error,
      })
    }

    try {
      this.logger.debug('Creating case comment')
      ResultWrapper.unwrap(
        await withTransaction(this.sequelize)(async (transaction) => {
          return await this.commentService.createComment(
            caseId,
            {
              internal: true,
              type: CaseCommentTypeEnum.Submit,
              comment: null,
              initiator: REYKJAVIKUR_BORG.id, // TODO: REPLACE WITH ACTUAL USER
              receiver: null,
              storeState: true,
            },
            transaction,
          )
        }),
      )
    } catch (error) {
      // we dont need to return the error since the comment is not vital for the process
      handleException({
        method: 'createCase',
        message: 'Error creating case comment',
        category: LOGGING_CATEGORY,
        error,
      })
    }

    this.logger.debug('Creating case categories')
    values.categories.forEach(async (category) => {
      await this.createCaseCategory(caseId, category.categoryId)
    })

    if (values.channels) {
      const { channels } = values
      this.logger.debug('Creating case channels')

      channels.forEach(async (channel) => {
        try {
          ResultWrapper.unwrap(await this.createCaseChannel(caseId, channel))
        } catch (error) {
          handleException({
            method: 'createCase',
            message: 'Error creating case channel',
            category: LOGGING_CATEGORY,
            error,
          })
        }
      })
    }

    this.logger.debug('Creating case signatures')
    values.signature.forEach(async (signatureBody) => {
      try {
        await this.signatureService.createCaseSignature(signatureBody)
      } catch (error) {
        handleException({
          method: 'createCase',
          message: 'Error creating case signature',
          category: LOGGING_CATEGORY,
          error,
        })
      }
    })

    try {
      const { attachments } = ResultWrapper.unwrap(
        await this.attachmentService.getAllAttachments(application.id),
      )

      attachments.forEach(async (attachment) => {
        try {
          ResultWrapper.unwrap(
            await this.attachmentService.createCaseAttachment(
              caseId,
              attachment.id,
            ),
          )
        } catch (error) {
          handleException({
            method: 'createCase',
            message: 'Error creating case attachment',
            category: LOGGING_CATEGORY,
            error,
          })
        }
      })
    } catch (error) {
      handleException({
        method: 'createCase',
        message: 'Could not get attachments',
        category: LOGGING_CATEGORY,
        error,
      })
    }

    return ResultWrapper.ok()
  }
}
