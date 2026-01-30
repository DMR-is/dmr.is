import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ApplicationStates } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdditionType,
  CaseCommunicationStatus,
  CaseStatusEnum,
  UpdateAdvertHtmlBody,
  UpdateCaseBody,
  UpdateCaseCommunicationBody,
  UpdateCaseDepartmentBody,
  UpdateCaseInvolvedPartyBody,
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

import { IApplicationService } from '../../../application/application.service.interface'
import { ICommentServiceV2 } from '../../../comment/v2'
import { IPriceService } from '../../../price/price.service.interface'
import { IUtilityService } from '../../../utility/utility.module'
import { updateCaseBodyMapper } from '../../mappers/case-update-body.mapper'
import {
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseModel,
  CaseStatusModel,
} from '../../models'
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
    @InjectModel(CaseAdditionModel)
    private readonly caseAdditionModel: typeof CaseAdditionModel,
    @InjectModel(CaseAdditionsModel)
    private readonly caseAdditionsModel: typeof CaseAdditionsModel,

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
    caseId: string,
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const updateData = updateCaseBodyMapper(body)

    await this.caseModel.update<CaseModel>(updateData, {
      where: {
        id: caseId,
      },
      returning: true,
      transaction: transaction,
    })

    // TODO: ApplicationCommunicationChannels?

    if (body.categoryIds?.length) {
      this.updateCaseCategories(
        caseId,
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
  async updateCaseInvolvedParty(
    caseId: string,
    body: UpdateCaseInvolvedPartyBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['id', 'applicationId', 'involvedPartyId'],
      transaction,
    })

    if (!caseLookup) {
      throw new BadRequestException('Case not found')
    }

    // Get the current involved party
    const currentInvolvedParty = ResultWrapper.unwrap(
      await this.utilityService.institutionLookup(
        caseLookup.involvedPartyId,
        transaction,
      ),
    )

    // Get the target involved party
    const targetInvolvedParty = ResultWrapper.unwrap(
      await this.utilityService.institutionLookup(
        body.involvedPartyId,
        transaction,
      ),
    )

    // Verify that national IDs match
    if (currentInvolvedParty.nationalId !== targetInvolvedParty.nationalId) {
      return ResultWrapper.err({
        code: 400,
        message: `Cannot update involved party. National ID mismatch.`,
        category: LOGGING_CATEGORY,
      })
    }

    await caseLookup.update({
      involvedPartyId: body.involvedPartyId,
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
                  departmentId: body.involvedPartyId,
                },
              },
            },
          ),
        )
      } catch (error) {
        this.logger.warn(
          `Could not update application<${caseLookup.applicationId}> involved party`,
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

    if (nextStatus === CaseStatusEnum.ReadyForPublishing) {
      try {
        await this.priceService.postExternalPaymentByCaseId(id, transaction)
      } catch (error) {
        // Log and continue ..
        this.logger.error(
          `Error occurred while processing external payment for case<${id}>: ${
            typeof error === 'object' && error !== null && 'message' in error
              ? (error as any).message
              : 'Unknown error'
          }`,
        )
      }
    }

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
  async updateCaseAddition(
    additionId: string,
    caseId: string,
    title?: string,
    content?: string,
    newOrder?: number,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    try {
      const updateFields: Partial<{
        title: string
        content: string
        type: AdditionType
      }> = {}

      if (title != null) updateFields.title = title
      if (content != null) updateFields.content = content

      const hasContentUpdates = Object.keys(updateFields).length > 0

      if (hasContentUpdates) {
        updateFields.type = AdditionType.Html

        await this.caseAdditionModel.update(updateFields, {
          where: { id: additionId },
          transaction,
        })
      }

      if (newOrder !== undefined && caseId) {
        const targetRow = await this.caseAdditionsModel.findOne({
          where: {
            additionId,
            caseId: caseId,
          },
          transaction,
        })

        if (!targetRow) {
          return ResultWrapper.err({
            code: 404,
            message: 'Addition not found in this case',
          })
        }

        const currentOrder = targetRow.order ?? 0

        if (newOrder < currentOrder) {
          await this.caseAdditionsModel.increment('order', {
            by: 1,
            where: {
              caseId: caseId,
              order: {
                [Op.gte]: newOrder,
                [Op.lt]: currentOrder,
              },
            },
            transaction,
          })
        } else if (newOrder > currentOrder) {
          await this.caseAdditionsModel.decrement('order', {
            by: 1,
            where: {
              caseId: caseId,
              order: {
                [Op.gt]: currentOrder,
                [Op.lte]: newOrder,
              },
            },
            transaction,
          })
        }

        await this.caseAdditionsModel.update(
          { order: newOrder },
          {
            where: {
              caseId: caseId,
              additionId,
            },
            transaction,
          },
        )
      }

      return ResultWrapper.ok()
    } catch (error) {
      this.logger.error(`Failed to update addition for <${additionId}>`, {
        category: LOGGING_CATEGORY,
        error,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update addition',
      })
    }
  }

  @LogAndHandle()
  @Transactional()
  async deleteCaseAddition(
    additionId: string,
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    try {
      const targetRow = await this.caseAdditionsModel.findOne({
        where: {
          additionId,
          caseId,
        },
        transaction,
      })

      if (!targetRow) {
        return ResultWrapper.err({
          code: 404,
          message: 'Addition not found in this case',
        })
      }

      const removedOrder = targetRow.order ?? 0

      await this.caseAdditionsModel.destroy({
        where: {
          additionId,
          caseId,
        },
        transaction,
      })

      await this.caseAdditionsModel.decrement('order', {
        by: 1,
        where: {
          caseId,
          order: {
            [Op.gt]: removedOrder,
          },
        },
        transaction,
      })

      await this.caseAdditionModel.destroy({
        where: {
          id: additionId,
        },
        transaction,
      })

      return ResultWrapper.ok()
    } catch (error) {
      this.logger.error(
        `Failed to delete addition <${additionId}> from case <${caseId}>`,
        {
          category: LOGGING_CATEGORY,
          error,
        },
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to delete addition',
      })
    }
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
                  html: Buffer.from(body.advertHtml).toString('base64'),
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
