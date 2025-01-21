import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { ApplicationStates } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CaseCommentSourceEnum,
  CaseCommentTypeTitleEnum,
  CaseCommunicationStatus,
  CaseStatusEnum,
  UpdateAdvertHtmlBody,
  UpdateCaseBody,
  UpdateCaseCommunicationBody,
  UpdateCaseDepartmentBody,
  UpdateCasePriceBody,
  UpdateCaseStatusBody,
  UpdateCaseTypeBody,
  UpdateCategoriesBody,
  UpdateCommunicationStatusBody,
  UpdateNextStatusBody,
  UpdatePaidBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack, getNextStatus, getPreviousStatus } from '@dmr.is/utils'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../../../application/application.service.interface'
import { ICommentService } from '../../../comment/comment.service.interface'
import { IUtilityService } from '../../../utility/utility.service.interface'
import { updateCaseBodyMapper } from '../../mappers/case-update-body.mapper'
import { CaseCategoriesModel, CaseModel } from '../../models'
import { ICaseUpdateService } from './case-update.service.interface'

const LOGGING_CATEGORY = 'case-update-service'

@Injectable()
export class CaseUpdateService implements ICaseUpdateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(ICommentService) private readonly commentService: ICommentService,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,

    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  @Transactional()
  private async updateCommunication(
    body: UpdateCaseCommunicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    if (body.reject) {
      this.logger.debug(
        `Communication status set to ${CaseCommunicationStatus.WaitingForAnswers}, rejecting application`,
      )

      const caseLookup = await this.caseModel.findByPk(body.caseId, {
        attributes: ['applicationId'],
      })

      if (caseLookup !== null && caseLookup.applicationId) {
        const { application } = (
          await this.applicationService.getApplication(caseLookup.applicationId)
        ).unwrap()

        if (application.state === ApplicationStates.SUBMITTED) {
          ResultWrapper.unwrap(
            await this.utilityService.editApplication(caseLookup.applicationId),
          )
        }
      }
    }

    await this.caseModel.update(
      {
        communicationStatusId: body.communicationLookupId,
      },
      {
        where: {
          id: body.caseId,
        },
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateEmployee(
    id: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseRes = (await this.utilityService.caseLookup(id)).unwrap()

    await this.caseModel.update(
      {
        assignedUserId: userId,
      },
      {
        where: {
          id,
        },
        transaction,
      },
    )

    await this.commentService.createComment(
      id,
      {
        internal: true,
        type: caseRes.assignedUserId
          ? CaseCommentTypeTitleEnum.Assign
          : CaseCommentTypeTitleEnum.AssignSelf,
        source: CaseCommentSourceEnum.API,
        storeState: false,
        comment: null,
        creator: 'Ármann Árni',
        receiver: 'Pálina',
      },
      transaction,
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const updateData = updateCaseBodyMapper(body)

    await this.caseModel.update<CaseModel>(updateData, {
      where: {
        id: body.caseId,
      },
      returning: true,
      transaction: transaction,
    })

    // TODO: ApplicationCommunicationChannels?

    if (body.categoryIds?.length) {
      this.updateCaseCategories(
        body.caseId,
        {
          categoryIds: body.categoryIds,
        },
        transaction,
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const lookup = (
      await this.utilityService.caseCommunicationStatusLookupById(
        body.statusId,
        transaction,
      )
    ).unwrap()

    if (lookup.title === CaseCommunicationStatus.WaitingForAnswers) {
      this.logger.debug(
        `Communication status set to ${CaseCommunicationStatus.WaitingForAnswers}, rejecting application`,
      )
      return this.updateCommunication(
        { caseId: caseId, communicationLookupId: lookup.id, reject: true },
        transaction,
      )
    }

    return this.updateCommunication(
      { caseId: caseId, communicationLookupId: lookup.id },
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCommunicationStatusByStatus(
    caseId: string,
    status: CaseCommunicationStatus,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const lookup = (
      await this.utilityService.caseCommunicationStatusLookup(
        status,
        transaction,
      )
    ).unwrap()

    if (status === CaseCommunicationStatus.WaitingForAnswers) {
      this.logger.debug(
        `Communication status set to ${status}, rejecting application`,
      )
      return this.updateCommunication(
        { caseId: caseId, communicationLookupId: lookup.id, reject: true },
        transaction,
      )
    }

    return this.updateCommunication(
      { caseId: caseId, communicationLookupId: lookup.id },
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseStatus(
    id: string,
    body: UpdateCaseStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const status = (
      await this.utilityService.caseStatusLookup(body.status)
    ).unwrap()

    await this.commentService.createComment(
      id,
      {
        internal: true,
        type: CaseCommentTypeTitleEnum.UpdateStatus,
        comment: null,
        source: CaseCommentSourceEnum.API,
        storeState: false,
        creator: 'Ármann Árni',
        receiver: status.title,
      },
      transaction,
    )

    await this.caseModel.update(
      {
        statusId: status.id,
      },
      {
        where: {
          id,
        },
        transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseNextStatus(
    id: string,
    body: UpdateNextStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const currentStatus = (
      await this.utilityService.caseStatusLookup(
        body.currentStatus,
        transaction,
      )
    ).unwrap()

    const allowedStatuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
    ]

    if (!allowedStatuses.includes(currentStatus.title)) {
      /**
       * Case status not in a state where it can be updated, so we return early
       */
      this.logger.debug(
        `Case status<${currentStatus.title}> is not in allowed statuses`,
      )
      return ResultWrapper.ok()
    }

    const nextStatus = getNextStatus(currentStatus.title)

    ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(nextStatus, transaction),
    )

    return this.updateCaseStatus(id, { status: nextStatus }, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePreviousStatus(
    id: string,
    body: UpdateNextStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const currentStatus = (
      await this.utilityService.caseStatusLookup(
        body.currentStatus,
        transaction,
      )
    ).unwrap()

    const allowedStatuses = [
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    if (!allowedStatuses.includes(currentStatus.title)) {
      /**
       * Case status not in a state where it can be updated, so we return early
       */
      this.logger.debug(
        `Case status<${currentStatus.title}> is not in allowed statuses`,
      )
      return ResultWrapper.ok()
    }

    const prevStatus = getPreviousStatus(currentStatus.title)

    ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(prevStatus, transaction),
    )

    return this.updateCaseStatus(id, { status: prevStatus }, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseModel.update(
      {
        price: body.price,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      departmentId: body.departmentId,
    })

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                departmentId: body.departmentId,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      advertTypeId: body.typeId,
      transaction,
    })

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                typeId: body.typeId,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    const currentCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId,
      },
      transaction: transaction,
    })

    const incomingCategories = await Promise.all(
      body.categoryIds.map(async (categoryId) => {
        ResultWrapper.unwrap(
          await this.utilityService.categoryLookup(categoryId, transaction),
        )

        return {
          caseId,
          categoryId,
        }
      }),
    )

    const newCategories = incomingCategories.filter((c) => c !== null) as {
      caseId: string
      categoryId: string
    }[]

    const newCategoryIds = newCategories.map((c) => c.categoryId)

    const toRemove = currentCategories.filter((c) =>
      newCategoryIds.includes(c.categoryId),
    )

    await this.caseCategoriesModel.bulkCreate(newCategories, {
      ignoreDuplicates: true,
      transaction: transaction,
    })

    await Promise.all(
      toRemove.map(async (c) => {
        await c.destroy({ transaction: transaction })
      }),
    )

    const newCurrentCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId,
      },
      transaction: transaction,
    })

    const ids = newCurrentCategories.map((c) => c.categoryId)

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                categories: ids,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const requestedPublicationDate = new Date(body.date)
    const { fastTrack } = getFastTrack(requestedPublicationDate)

    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
      transaction,
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      requestedPublicationDate: body.date,
      fastTrack: fastTrack,
      transaction,
    })

    // const applicationId = updatedModels[0].applicationId

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                requestedDate: body.date,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
      transaction,
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                title: body.title,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseModel.update(
      {
        paid: body.paid,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseTag(
    caseId: string,
    body: UpdateTagBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseModel.update(
      {
        tagId: body.tagId,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['applicationId'],
      transaction,
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      html: body.advertHtml,
      transaction,
    })

    if (caseLookup.applicationId) {
      ResultWrapper.unwrap(
        await this.applicationService.updateApplication(
          caseLookup.applicationId,
          {
            answers: {
              advert: {
                html: body.advertHtml,
              },
            },
          },
        ),
      )
    }

    return ResultWrapper.ok()
  }
}
