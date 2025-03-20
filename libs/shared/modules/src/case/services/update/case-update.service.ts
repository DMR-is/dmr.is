import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { ApplicationStates } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
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
  UpdateFasttrackBody,
  UpdatePublishDateBody,
  UpdateTagBody,
  UpdateTitleBody,
  UserDto,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { getFastTrack, getNextStatus, getPreviousStatus } from '@dmr.is/utils'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IApplicationService } from '../../../application/application.service.interface'
import { ICommentServiceV2 } from '../../../comment/v2'
import { IPriceService } from '../../../price/price.service.interface'
import { IUtilityService } from '../../../utility/utility.module'
import { updateCaseBodyMapper } from '../../mappers/case-update-body.mapper'
import { CaseCategoriesModel, CaseModel, CaseStatusModel } from '../../models'
import { ICaseUpdateService } from './case-update.service.interface'

const LOGGING_CATEGORY = 'case-update-service'
const LOGGING_CONTEXT = 'CaseUpdateService'

@Injectable()
export class CaseUpdateService implements ICaseUpdateService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(ICommentServiceV2)
    private readonly commentService: ICommentServiceV2,

    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,

    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,

    @Inject(IPriceService)
    private readonly priceService: IPriceService,

    private readonly sequelize: Sequelize,
  ) {}
  async updateFasttrack(
    caseId: string,
    body: UpdateFasttrackBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseModel.update(
      {
        fastTrack: body.fasttrack,
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
  private async updateCommunication(
    body: UpdateCaseCommunicationBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    if (body.reject) {
      this.logger.debug(
        `Communication status set to ${CaseCommunicationStatus.WaitingForAnswers}, rejecting application`,
      )

      const caseLookup = await this.caseModel.findByPk(body.caseId, {
        attributes: ['id', 'applicationId'],
      })

      if (!caseLookup) {
        throw new BadRequestException('Case not found')
      }

      if (caseLookup.applicationId) {
        try {
          const { application } = (
            await this.applicationService.getApplication(
              caseLookup.applicationId,
            )
          ).unwrap()

          if (application.state === ApplicationStates.SUBMITTED) {
            ResultWrapper.unwrap(
              await this.utilityService.editApplication(
                caseLookup.applicationId,
              ),
            )
          }
        } catch (error) {
          this.logger.warn(
            `Could not reject application<${caseLookup.applicationId}>`,
            {
              context: LOGGING_CONTEXT,
              category: LOGGING_CATEGORY,
              applicationId: caseLookup.applicationId,
              error: error,
            },
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
    caseId: string,
    targetUserId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    if (currentUser.id === targetUserId) {
      ResultWrapper.unwrap(
        await this.commentService.createAssignSelfComment(
          caseId,
          {
            adminUserCreatorId: currentUser.id,
          },
          transaction,
        ),
      )
    } else {
      ResultWrapper.unwrap(
        await this.commentService.createAssignUserComment(
          caseId,
          {
            adminUserCreatorId: currentUser.id,
            adminUserReceiverId: targetUserId,
          },
          transaction,
        ),
      )
    }

    await this.caseModel.update(
      {
        assignedUserId: targetUserId,
      },
      {
        where: {
          id: caseId,
        },
        transaction,
      },
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
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const status = (
      await this.utilityService.caseStatusLookup(body.status)
    ).unwrap()

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

    await this.commentService.createUpdateStatusComment(id, {
      adminUserCreatorId: currentUser.id,
      caseStatusReceiverId: status.id,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseNextStatus(
    id: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(id, {
      attributes: ['id', 'statusId'],
      transaction,
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const allowedStatuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
    ]

    if (!allowedStatuses.includes(caseLookup.status.title)) {
      /**
       * Case status not in a state where it can be updated, so we return early
       */
      this.logger.debug(
        `Case status<${caseLookup.status.title}> is not in allowed statuses`,
      )
      return ResultWrapper.ok()
    }

    const nextStatus = getNextStatus(caseLookup.status.title)

    // if (nextStatus === CaseStatusEnum.ReadyForPublishing) {
    //   this.priceService.postExternalPayment(id)
    // }

    ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(nextStatus, transaction),
    )

    return this.updateCaseStatus(
      id,
      { status: nextStatus },
      currentUser,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePreviousStatus(
    id: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(id, {
      attributes: ['id', 'statusId'],
      transaction,
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const allowedStatuses = [
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    if (!allowedStatuses.includes(caseLookup.status.title)) {
      /**
       * Case status not in a state where it can be updated, so we return early
       */
      this.logger.debug(
        `Case status<${caseLookup.status.title}> is not in allowed statuses`,
      )
      return ResultWrapper.ok()
    }

    const prevStatus = getPreviousStatus(caseLookup.status.title)

    ResultWrapper.unwrap(
      await this.utilityService.caseStatusLookup(prevStatus, transaction),
    )

    return this.updateCaseStatus(
      id,
      { status: prevStatus },
      currentUser,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    try {
      await this.priceService.updateCasePriceByCaseId(caseId, body, transaction)
    } catch (error) {
      return ResultWrapper.err({
        code: 500,
        message: `Could not create fee transaction for case<${caseId}>. ${error}`,
        category: LOGGING_CATEGORY,
      })
    }

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
      attributes: ['id', 'applicationId'],
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      departmentId: body.departmentId,
      transaction,
    })

    if (caseLookup.applicationId) {
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> department`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
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
      attributes: ['id', 'applicationId'],
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      advertTypeId: body.typeId,
      transaction,
    })

    if (caseLookup.applicationId) {
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> type`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
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
      attributes: ['id', 'applicationId'],
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
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> categories`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
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
      attributes: ['id', 'applicationId'],
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

    if (caseLookup.applicationId) {
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> requested publication date`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
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
      attributes: ['id', 'applicationId'],
      transaction,
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    await caseLookup.update({
      advertTitle: body.title,
      transaction,
    })

    if (caseLookup.applicationId) {
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> title`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
    }

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
      attributes: ['id', 'applicationId'],
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
      try {
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
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> advert html`,
          {
            context: LOGGING_CONTEXT,
            category: LOGGING_CATEGORY,
            applicationId: caseLookup.applicationId,
            error: error,
          },
        )
      }
    }

    return ResultWrapper.ok()
  }
}
