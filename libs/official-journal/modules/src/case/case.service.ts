import Mail from 'nodemailer/lib/mailer'
import { Op, OrderItem, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AttachmentTypeParam, REGULATION_TYPES } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AddCaseAdvertCorrection,
  AdvertStatus,
  Case,
  CaseChannel,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseChannelBody,
  CreateCaseDto,
  CreateCaseResponseDto,
  DeleteCaseAdvertCorrection,
  DepartmentEnum,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCasesWithDepartmentCount,
  GetCasesWithDepartmentCountQuery,
  GetCasesWithPublicationNumber,
  GetCasesWithPublicationNumberQuery,
  GetCasesWithStatusCount,
  GetCasesWithStatusCountQuery,
  GetCommunicationSatusesResponse,
  GetInstitutionsFullResponse,
  GetNextPublicationNumberResponse,
  GetPaymentQuery,
  GetPaymentResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
  UpdateCaseBody,
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
} from '@dmr.is/shared-dto'
import { IAWSService } from '@dmr.is/shared-modules'
import { ResultWrapper } from '@dmr.is/types'
import {
  enumMapper,
  generatePaging,
  getLimitAndOffset,
  getPublicationTemplate,
  getS3Bucket,
} from '@dmr.is/utils/server/serverUtils'

import { AdvertMainTypeModel, AdvertTypeModel } from '../advert-type/models'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../attachments/models'
import { IExternalService } from '../external/external.service.interface'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
} from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { IPriceService } from '../price/price.service.interface'
import { IReindexRunnerService } from '../search'
import { SignatureModel } from '../signature/models/signature.model'
import { SignatureMemberModel } from '../signature/models/signature-member.model'
import { SignatureRecordModel } from '../signature/models/signature-record.model'
import { IUtilityService } from '../utility/utility.service.interface'
import { caseParameters } from './mappers/case-parameters.mapper'
import { caseMigrate } from './migrations/case.migrate'
import { caseAdditionMigrate } from './migrations/case-addition.migrate'
import { caseChannelMigrate } from './migrations/case-channel.migrate'
import { caseCommunicationStatusMigrate } from './migrations/case-communication-status.migrate'
import { caseDetailedMigrate } from './migrations/case-detailed.migrate'
import { caseTagMigrate } from './migrations/case-tag.migrate'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { ICaseService } from './case.service.interface'
import {
  CaseAdditionModel,
  CaseAdditionsModel,
  CaseCategoriesModel,
  CaseChannelModel,
  CaseChannelsModel,
  CaseCommunicationStatusModel,
  CaseHistoryModel,
  CaseModel,
  CasePublishedAdvertsModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'
import { casesDetailedIncludes, casesIncludes } from './relations'

const LOGGING_CATEGORY = 'case-service'
const LOGGING_QUERY = 'CaseServiceQueryRunner'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(forwardRef(() => IJournalService))
    private readonly journalService: IJournalService,
    @Inject(ICaseCreateService)
    private readonly createService: ICaseCreateService,
    @Inject(forwardRef(() => IAWSService)) private readonly s3: IAWSService,

    @Inject(forwardRef(() => IAttachmentService))
    private readonly attachmentService: IAttachmentService,
    @Inject(forwardRef(() => IPdfService))
    private readonly pdfService: IPdfService,

    @Inject(ICaseUpdateService)
    private readonly updateService: ICaseUpdateService,

    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseTagModel)
    private readonly caseTagModel: typeof CaseTagModel,
    @InjectModel(CaseStatusModel)
    private readonly caseStatusModel: typeof CaseStatusModel,

    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,

    @InjectModel(AdvertCorrectionModel)
    private advertCorrectionModel: typeof AdvertCorrectionModel,

    @InjectModel(AdvertMainTypeModel)
    private readonly advertMainTypeModel: typeof AdvertMainTypeModel,

    @Inject(IPriceService)
    private readonly priceService: IPriceService,

    @Inject(IExternalService)
    private readonly externalService: IExternalService,

    @InjectModel(CasePublishedAdvertsModel)
    private readonly casePublishedAdvertsModel: typeof CasePublishedAdvertsModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(CaseCategoriesModel)
    private readonly caseCategoriesModel: typeof CaseCategoriesModel,
    @InjectModel(CaseHistoryModel)
    private readonly caseHistoryModel: typeof CaseHistoryModel,
    @InjectModel(CaseChannelModel)
    private readonly caseChannelModel: typeof CaseChannelModel,
    @InjectModel(CaseChannelsModel)
    private readonly caseChannelsModel: typeof CaseChannelsModel,
    @InjectModel(CaseAdditionsModel)
    private readonly caseAdditionsModel: typeof CaseAdditionsModel,
    private readonly sequelize: Sequelize,

    @Inject(IReindexRunnerService)
    private readonly runner: IReindexRunnerService,
  ) {
    this.logger.info('Using CaseService')
  }
  @LogAndHandle()
  @Transactional()
  async deleteCaseChannel(
    caseId: string,
    channelId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.caseChannelsModel.destroy({
      where: {
        caseId: caseId,
        channelId: channelId,
      },
      transaction,
    })
    await this.caseChannelModel.destroy({
      where: {
        id: channelId,
      },
      transaction,
    })

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createCase(
    currentUser: UserDto,
    body: CreateCaseDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CreateCaseResponseDto>> {
    const results = this.createService.createCase(
      currentUser,
      body,
      transaction,
    )

    return results
  }

  @LogAndHandle()
  @Transactional()
  async createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const now = new Date().toISOString()
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [
        'id',
        'departmentId',
        'statusId',
        'advertTypeId',
        'involvedPartyId',
        'assignedUserId',
        'advertTitle',
        'html',
        'requestedPublicationDate',
      ],
      transaction,
    })

    if (caseLookup === null) {
      this.logger.warn(`Tried to create case history, but case is not found`, {
        caseId,
        category: LOGGING_CATEGORY,
        context: 'CaseService',
      })
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const historyId = uuid()
    await this.caseHistoryModel.create(
      {
        id: historyId,
        caseId: caseLookup.id,
        departmentId: caseLookup.departmentId,
        typeId: caseLookup.advertTypeId,
        statusId: caseLookup.statusId,
        involvedPartyId: caseLookup.involvedPartyId,
        userId: caseLookup.assignedUserId,
        title: caseLookup.advertTitle,
        html: caseLookup.html,
        requestedPublicationDate: new Date(
          caseLookup.requestedPublicationDate,
        ).toISOString(),
        created: now,
      },
      { transaction },
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  updateCaseFasttrack(
    caseId: string,
    body: UpdateFasttrackBody,
  ): Promise<ResultWrapper> {
    return this.updateService.updateFasttrack(caseId, body)
  }

  private async getCasesSqlQuery(params: GetCasesQuery) {
    const whereParams = caseParameters(params)
    const sortKeys: { [key: string]: OrderItem } = {
      caseRequestPublishDate: ['requestedPublicationDate', params.direction],
      casePublishDate: Sequelize.literal(
        `"publishedAt" ${params.direction} NULLS LAST`,
      ),
      caseRegistrationDate: ['createdAt', params.direction],
      caseStatus: ['statusId', params.direction],
    }
    const sortBy = sortKeys[params.sortBy] || 'requestedPublicationDate'
    const { limit, offset } = getLimitAndOffset(params)

    return this.caseModel.findAndCountAll({
      distinct: true,
      benchmark: true,
      offset: offset,
      limit: limit,
      attributes: [
        'id',
        'requestedPublicationDate',
        'createdAt',
        'year',
        'advertTitle',
        'fastTrack',
        'publishedAt',
        'publicationNumber',
        'statusId',
        'caseNumber',
      ],
      where: whereParams,
      include: casesIncludes({
        department: params?.department,
        type: params?.type,
        status: params?.status,
        institution: params?.institution,
        category: params?.category,
      }),
      order: [sortBy],
      logging: (_, timing) => {
        this.logger.info(`getCasesSqlQuery executed in ${timing}ms`, {
          context: LOGGING_QUERY,
          category: LOGGING_CATEGORY,
          query: 'getCasesSqlQuery',
        })
      },
    })
  }

  async getCasesWithPublicationNumber(
    department: DepartmentEnum,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>> {
    if (!params?.id) {
      return ResultWrapper.err({
        code: 400,
        message: 'Missing required parameter id',
      })
    }

    // publication number is dependent on the signature date
    // so we take the year from the signature date and count from there
    const cases = await this.caseModel.findAll({
      benchmark: true,
      attributes: [
        'id',
        'requestedPublicationDate',
        'createdAt',
        'year',
        'advertTitle',
        'fastTrack',
        'publishedAt',
        'publicationNumber',
      ],
      include: [
        ...casesIncludes({ department: department }),
        {
          model: SignatureModel,
          attributes: ['date'],
        },
      ],
      logging: (_, timing) => {
        this.logger.info(
          `getCasesWithPublicationNumber query executed in ${timing}ms`,
          {
            context: LOGGING_QUERY,
            category: LOGGING_CATEGORY,
            query: 'getCasesWithPublicationNumber',
          },
        )
      },
    })

    if (cases.length === 0) {
      return ResultWrapper.ok({
        cases: [],
      })
    }

    // we must ensure the order of the cases is the same as passed in the params
    const sortedCases = params.id
      .map((id) => cases.find((c) => c.id === id))
      .filter((c) => c !== undefined) // this should never happen, but for typescript

    const calculateNextPublicationNumber = async () => {
      const publicationYears: number[] = []
      const migratedCases: Case[] = []
      for (const c of sortedCases) {
        const year = c.year

        const nextPublicationNumber = await this.advertModel.count({
          benchmark: true,
          distinct: true,
          where: {
            departmentId: {
              [Op.eq]: c.department.id,
            },
            [Op.and]: [
              Sequelize.where(
                Sequelize.fn(
                  'EXTRACT',
                  Sequelize.literal(`YEAR FROM "signature_date"`),
                ),
                year,
              ),
            ],
          },
          logging: (_, timing) =>
            this.logger.info(
              `getCasesWithPublicationNumber nextPublicationNumber query executed in ${timing}ms`,
              {
                context: LOGGING_QUERY,
                category: LOGGING_CATEGORY,
                query: 'getCasesWithPublicationNumber',
              },
            ),
        })

        const yearCount = publicationYears.filter((y) => y === year).length
        publicationYears.push(year)

        const mappedCase = caseMigrate(c)
        migratedCases.push({
          ...mappedCase,
          publicationNumber: `${nextPublicationNumber + yearCount + 1}`,
        })
      }

      return migratedCases
    }

    const mapped = await calculateNextPublicationNumber()

    return ResultWrapper.ok({
      cases: mapped.sort((a, b) => a.year - b.year),
    })
  }

  @LogAndHandle()
  @Transactional()
  async unpublishCase(id: string): Promise<ResultWrapper> {
    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Unpublished)
    ).unwrap()

    // TODO: Remove PUBLISHED_CASE_ADVERTS table
    // Then remove all casePublishedAdvertsModel references
    // Use advertId from case directly instead.
    const hasAdvertPromise = await this.casePublishedAdvertsModel.findOne({
      where: {
        caseId: id,
      },
    })

    const updateCasePromise = this.caseModel.update(
      {
        statusId: caseStatus.id,
        publishedAt: null,
      },
      {
        where: {
          id: id,
        },
      },
    )

    const [_, hasAdvert] = await Promise.all([
      updateCasePromise,
      hasAdvertPromise,
    ])

    if (!hasAdvert) {
      return ResultWrapper.ok()
    }

    const statusLookup = await this.utilityService.advertStatusLookup(
      AdvertStatus.Revoked,
    )

    if (!statusLookup.result.ok) {
      this.logger.error('Failed to get advert status', {
        error: statusLookup.result.error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to get advert status',
      })
    }

    const updateResult = await this.journalService.updateAdvert(
      hasAdvert.advertId,
      {
        statusId: statusLookup.result.value.id,
      },
    )

    if (!updateResult.result.ok) {
      this.logger.error('Failed to update advert status', {
        error: updateResult.result.error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update advert status',
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  updateEmployee(
    caseId: string,
    userId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateEmployee(
      caseId,
      userId,
      currentUser,
      transaction,
    )
  }
  @LogAndHandle()
  @Transactional()
  updateCase(
    caseId: string,
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCase(caseId, body, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async createCaseFromAdvert(
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const advertLookup = await this.journalService.getAdvert(advertId)

    if (!advertLookup.result.ok) {
      this.logger.error('Failed to get updated advert', {
        category: 'JournalService',
        metadata: { advertId },
      })

      return ResultWrapper.err({
        message: 'Failed to get updated advert',
        code: 500,
      })
    }

    const advertData = advertLookup.result.value.advert

    ResultWrapper.unwrap(
      await this.createService.createCaseByAdvert(advertData, transaction),
    )

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseStatus(
    caseId: string,
    body: UpdateCaseStatusBody,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.updateService.updateCaseStatus(
      caseId,
      body,
      currentUser,
      transaction,
    )

    if (body.status !== CaseStatusEnum.Unpublished) {
      return ResultWrapper.ok()
    }

    const casePublishedAdvert = await this.casePublishedAdvertsModel.findOne({
      where: {
        caseId: caseId,
      },
    })

    if (!casePublishedAdvert) {
      return ResultWrapper.ok()
    }

    const statusLookup = await this.utilityService.advertStatusLookup(
      AdvertStatus.Revoked,
    )

    if (!statusLookup.result.ok) {
      this.logger.error(
        `Failed to get advert status, when unpublishing case<${caseId}>`,
        {
          caseId: caseId,
          advertId: casePublishedAdvert.advertId,
          advertStatus: AdvertStatus.Revoked,
          error: statusLookup.result.error,
          category: LOGGING_CATEGORY,
        },
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to get advert status',
      })
    }

    const updatedAdvertStatusResult = await this.journalService.updateAdvert(
      casePublishedAdvert.advertId,
      {
        statusId: statusLookup.result.value.id,
      },
    )

    if (!updatedAdvertStatusResult.result.ok) {
      this.logger.error(
        `Failed to update advert status<${AdvertStatus.Revoked}, when unpublishing case<${caseId}>`,
        {
          caseId: caseId,
          advertId: casePublishedAdvert.advertId,
          advertStatus: AdvertStatus.Revoked,
          error: updatedAdvertStatusResult.result.error,
          category: LOGGING_CATEGORY,
        },
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update advert status',
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  updateCaseNextStatus(
    caseId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseNextStatus(
      caseId,
      currentUser,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  updateCasePreviousStatus(
    caseId: string,
    currentUser: UserDto,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCasePreviousStatus(
      caseId,
      currentUser,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  updateCasePrice(
    caseId: string,
    body: UpdateCasePriceBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCasePrice(caseId, body, transaction)
  }
  @LogAndHandle()
  @Transactional()
  updateCaseDepartment(
    caseId: string,
    body: UpdateCaseDepartmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseDepartment(caseId, body, transaction)
  }
  @LogAndHandle()
  @Transactional()
  updateCaseType(
    caseId: string,
    body: UpdateCaseTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseType(caseId, body, transaction)
  }

  @LogAndHandle()
  @Transactional()
  updateCaseCategories(
    caseId: string,
    body: UpdateCategoriesBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseCategories(caseId, body, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async updateCaseAndAdvertCategories(
    caseId: string,
    body: UpdateCategoriesBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    // First, update the case categories
    const updateCaseResult = await this.updateService.updateCaseCategories(
      caseId,
      body,
      transaction,
    )

    if (!updateCaseResult.result.ok) {
      return updateCaseResult
    }

    // Get the case to find the associated advert
    const caseRecord = await this.caseModel.findByPk(caseId, {
      attributes: ['id', 'advertId'],
      transaction,
    })

    if (!caseRecord || !caseRecord.advertId) {
      // If no advert is associated with the case, just return success
      return ResultWrapper.ok()
    }

    // Fetch ALL current categories from the case.
    const allCaseCategories = await this.caseCategoriesModel.findAll({
      where: {
        caseId: caseId,
      },
      attributes: ['categoryId'],
      transaction,
    })

    const allCategoryIds = allCaseCategories.map((cc) => cc.categoryId)

    // Update advert categories to match ALL case categories
    const updateAdvertResult = await this.journalService.updateAdvertCategories(
      caseRecord.advertId,
      allCategoryIds,
      transaction,
    )

    if (!updateAdvertResult.result.ok) {
      return updateAdvertResult
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  updateCaseRequestedPublishDate(
    caseId: string,
    body: UpdatePublishDateBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseRequestedPublishDate(
      caseId,
      body,
      transaction,
    )
  }
  @LogAndHandle()
  @Transactional()
  updateCaseTitle(
    caseId: string,
    body: UpdateTitleBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseTitle(caseId, body, transaction)
  }
  @LogAndHandle()
  @Transactional()
  updateCaseTag(
    caseId: string,
    body: UpdateTagBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseTag(caseId, body, transaction)
  }

  @LogAndHandle()
  @Transactional()
  updateCaseAddition(
    additionId: string,
    caseId: string,
    title?: string,
    content?: string,
    newOrder?: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseAddition(
      additionId,
      caseId,
      title,
      content,
      newOrder ? parseInt(newOrder) : undefined,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.createService.createCaseAddition(
      caseId,
      title,
      content,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  deleteCaseAddition(
    additionId: string,
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.deleteCaseAddition(
      additionId,
      caseId,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  updateCaseCommunicationStatus(
    caseId: string,
    body: UpdateCommunicationStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseCommunicationStatus(
      caseId,
      body,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  updateCaseCommunicationStatusByStatus(
    caseId: string,
    body: CaseCommunicationStatus,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseCommunicationStatusByStatus(
      caseId,
      body,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvert(
    caseId: string,
    body: UpdateAdvertHtmlCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const { advertHtml, title, ...rest } = body

    const activeCase = await this.caseModel.findByPk(caseId, {
      include: [
        ...casesDetailedIncludes,
        CaseChannelModel,
        {
          model: AdvertModel,
          attributes: ['documentPdfUrl', 'id'],
        },
        {
          model: SignatureModel,
          include: [
            AdvertInvolvedPartyModel,
            {
              model: SignatureRecordModel,
              as: 'records',
              separate: true,
              include: [
                {
                  model: SignatureMemberModel,
                  as: 'chairman',
                },
                {
                  model: SignatureMemberModel,
                  as: 'members',
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: SignatureRecordModel,
                      required: false,
                    },
                  ],
                  where: {
                    [Op.or]: [
                      // Exclude chairman using Sequelize.where
                      Sequelize.where(
                        Sequelize.col('SignatureMemberModel.id'),
                        Op.ne,
                        Sequelize.col('record.chairman_id'),
                      ),
                      // Include all members if chairman_id is NULL
                      Sequelize.where(
                        Sequelize.col('record.chairman_id'),
                        Op.is,
                        null,
                      ),
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
      transaction,
    })

    if (!activeCase) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const postfix = `leidrett_${Date.now()}`
    const keyFallback = `${caseId}.pdf` // Fallback to caseId if no url. Highly unlikely, but just in case.

    const docUrl = activeCase?.advert?.documentPdfUrl ?? keyFallback
    const docName =
      activeCase?.advert?.documentPdfUrl.split('/').pop() ?? keyFallback

    if (!activeCase?.advert?.documentPdfUrl) {
      this.logger.error(
        `Failed to get advert pdf url<${activeCase?.advertId}>, in case<${caseId}`,
        {
          caseId: caseId,
          advertId: activeCase?.advertId,
          category: LOGGING_CATEGORY,
          pdfName: docUrl,
        },
      )
    }

    const pdfUrl = docUrl.replace('.pdf', `_${postfix}.pdf`)
    const pdfName = docName.replace('.pdf', `_${postfix}.pdf`)

    ResultWrapper.unwrap(
      await this.createPdfAndUpload(
        caseId,
        pdfName,
        undefined,
        undefined,
        new Date(),
      ),
    )

    const signatureHtml = activeCase.signature.html
    const additionsOrAttachmentInfoHtml =
      (activeCase.additions && activeCase.additions.length > 0) ||
      (activeCase.attachments && activeCase.attachments.length > 0)
        ? `<p align="center" style="margin-top: 1.5em;">VIÐAUKI<br>(sjá PDF-skjal)</p>`
        : ''
    const publicationHtml = getPublicationTemplate(
      activeCase.department.title,
      activeCase.requestedPublicationDate,
    )
    const publishHtml =
      advertHtml +
      signatureHtml +
      additionsOrAttachmentInfoHtml +
      publicationHtml

    const [updateAdvertCheck, updatePublishedCheck, postCaseCorrectionCheck] =
      await Promise.all([
        this.updateAdvertByHtml(
          caseId,
          { advertHtml, documentPdfUrl: pdfUrl },
          transaction,
        ),
        this.updatePublishedAdvertByHtml(caseId, {
          advertHtml: publishHtml,
          documentPdfUrl: pdfUrl,
          title,
          ...(activeCase?.requestedPublicationDate && {
            publicationDate: new Date(activeCase.requestedPublicationDate),
          }),
        }),
        this.postCaseCorrection(
          caseId,
          {
            ...rest,
            documentHtml: advertHtml,
            documentPdfUrl: pdfUrl,
            title,
          },
          transaction,
        ),
      ])

    ResultWrapper.unwrap(updateAdvertCheck)
    ResultWrapper.unwrap(updatePublishedCheck)
    ResultWrapper.unwrap(postCaseCorrectionCheck)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  private async updatePublishedAdvertByHtml(
    caseId: string,
    body: UpdateAdvertHtmlBody,
  ): Promise<ResultWrapper> {
    const [advertResult] = await Promise.all([this.caseModel.findByPk(caseId)])

    if (!advertResult?.advertId) {
      return ResultWrapper.ok()
    }

    const updateResult = await this.journalService.updateAdvert(
      advertResult.advertId,
      {
        documentHtml: body.advertHtml,
        ...(body.title && { title: body.title }),
        ...(body.publicationDate && { publicationDate: body.publicationDate }),
      },
    )

    if (!updateResult.result.ok) {
      this.logger.error(
        `Failed to update advert<${advertResult.advertId}>, when updating case<${caseId}.html`,
        {
          caseId: caseId,
          advertId: advertResult.advertId,
          error: updateResult.result.error,
          category: LOGGING_CATEGORY,
        },
      )

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update advert',
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvertByHtml(
    caseId: string,
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const [updatedCaseResult] = await Promise.all([
      this.updateService.updateAdvert(caseId, body, transaction),
    ])

    if (!updatedCaseResult.result.ok) {
      this.logger.error(`Failed to update html on case<${caseId}>`, {
        error: updatedCaseResult.result.error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update case',
      })
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle({ logArgs: false })
  private async createPdfAndUpload(
    caseId: string,
    fileName: string,
    publishedAt?: string | Date,
    serial?: number,
    correctionDate?: string | Date,
  ): Promise<ResultWrapper> {
    const advertPdf = await this.pdfService.generatePdfByCaseId(
      caseId,
      publishedAt,
      serial,
      correctionDate,
    )

    if (!advertPdf.result.ok) {
      this.logger.warn('Failed to get pdf for case', {
        error: advertPdf.result.error,
        category: LOGGING_CATEGORY,
      })
    }

    if (advertPdf.result.ok) {
      const bucket = getS3Bucket()
      const key = `adverts/${fileName}`
      const upload = await this.s3.uploadObject(
        bucket,
        key,
        fileName,
        advertPdf.result.value,
      )

      if (!upload.result.ok) {
        this.logger.warn('Failed to upload pdf to s3', {
          error: upload.result.error,
          category: LOGGING_CATEGORY,
        })
      } else {
        this.logger.debug('Uploaded pdf to s3', {
          url: upload.result.value,
          category: LOGGING_CATEGORY,
        })
      }
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle({ logArgs: false })
  async generatePdfByCase(caseId: string): Promise<Buffer | null> {
    const advertPdf = await this.pdfService.generatePdfByCaseId(
      caseId,
      new Date(),
      `000/${new Date().getFullYear()}`,
    )

    if (!advertPdf.result.ok) {
      this.logger.warn('Failed to get pdf for case', {
        error: advertPdf.result.error,
        category: LOGGING_CATEGORY,
      })

      return null
    }

    return advertPdf.result.value
  }

  @LogAndHandle()
  @Transactional()
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<CaseChannel>> {
    return this.createService.createCaseChannel(caseId, body, transaction)
  }

  @LogAndHandle({ logArgs: false })
  private async publishCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseToPublish = await this.caseModel.findByPk(caseId, {
      include: [
        ...casesDetailedIncludes,
        CaseChannelModel,
        {
          model: SignatureModel,
          include: [
            AdvertInvolvedPartyModel,
            {
              model: SignatureRecordModel,
              as: 'records',
              separate: true,
              include: [
                {
                  model: SignatureMemberModel,
                  as: 'chairman',
                },
                {
                  model: SignatureMemberModel,
                  as: 'members',
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: SignatureRecordModel,
                      required: false,
                    },
                  ],
                  where: {
                    [Op.or]: [
                      // Exclude chairman using Sequelize.where
                      Sequelize.where(
                        Sequelize.col('SignatureMemberModel.id'),
                        Op.ne,
                        Sequelize.col('record.chairman_id'),
                      ),
                      // Include all members if chairman_id is NULL
                      Sequelize.where(
                        Sequelize.col('record.chairman_id'),
                        Op.is,
                        null,
                      ),
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    if (!caseToPublish) {
      this.logger.warn(`Tried to publish case, but case is not found`, {
        caseId,
        category: LOGGING_CATEGORY,
        context: 'CaseService',
      })
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const now = new Date()

    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Published)
    ).unwrap()

    const signatureRecords = caseToPublish.signature.records
    const newest = signatureRecords
      .map((item) => item.signatureDate)
      .sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime()
      })[0]

    const signatureYear = newest
      ? new Date(newest).getFullYear()
      : new Date().getFullYear()
    const serial = (
      await this.utilityService.getNextPublicationNumber(
        caseToPublish.departmentId,
        signatureYear,
        transaction,
      )
    ).unwrap()

    const signatureHtml = caseToPublish.signature.html
    const departmentPrefix = caseToPublish.department.slug
      .replace('-deild', '')
      .toUpperCase()
    const pdfFileName = `${departmentPrefix}_nr_${serial}_${signatureYear}.pdf`

    const createPdfAndUploadResults = await this.createPdfAndUpload(
      caseId,
      pdfFileName,
      now,
      serial,
    )

    if (!createPdfAndUploadResults.result.ok) {
      this.logger.error(
        `Failed to create and upload pdf for case <${caseId}>`,
        {
          error: createPdfAndUploadResults.result.error,
          caseId: caseId,
          fileName: pdfFileName,
          category: LOGGING_CATEGORY,
        },
      )
    }

    const publicationHtml = getPublicationTemplate(
      caseToPublish.department.title,
      now,
    )

    const additionsOrAttachmentInfoHtml =
      (caseToPublish.additions && caseToPublish.additions.length > 0) ||
      (caseToPublish.attachments && caseToPublish.attachments.length > 0)
        ? `<p align="center" style="margin-top: 1.5em;">VIÐAUKI<br>(sjá PDF-skjal)</p>`
        : ''

    const advertCreateResult = await this.journalService.create(
      {
        departmentId: caseToPublish.departmentId,
        typeId: caseToPublish.advertTypeId,
        involvedPartyId: caseToPublish.involvedParty.id,
        subject: caseToPublish.advertTitle,
        serial: serial,
        categories: caseToPublish.categories?.map((c) => c.id) ?? [],
        publicationDate: now.toISOString(),
        signatureDate: newest,
        content:
          caseToPublish.html +
          signatureHtml +
          additionsOrAttachmentInfoHtml +
          publicationHtml,
        pdfUrl: `${process.env.ADVERTS_CDN_URL ?? 'https://adverts.stjornartidindi.is'}/${pdfFileName}`,
        advertId: caseToPublish.proposedAdvertId,
        publicationYear: signatureYear.toString(),
        hideSignatureDate: caseToPublish.hideSignatureDate,
      },
      transaction,
    )

    if (!advertCreateResult.result.ok) {
      this.logger.error('Failed to create advert', {
        error: advertCreateResult.result.error,
        errorSpread: { ...advertCreateResult.result.error },
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: advertCreateResult.result.error.message,
      })
    }

    await caseToPublish.update(
      {
        publicationNumber: serial,
        advertId: advertCreateResult.result.value.advert.id,
        statusId: caseStatus.id,
        publishedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        year: signatureYear,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    this.logger.info(`Marking case <${caseId}> as published`, {
      caseId: caseId,
      advertId: advertCreateResult.result.value.advert.id,
      publicationNumber: serial,
      publicationYear: signatureYear,
      category: LOGGING_CATEGORY,
    })

    const emails = caseToPublish?.channels?.flatMap((item) => {
      if (!item.email) {
        return []
      }
      return [item.email]
    })

    const publicationNumber =
      advertCreateResult?.result.value.advert.publicationNumber?.full ?? ''

    const message: Mail.Options = {
      from: `Stjórnartíðindi <noreply@stjornartidindi.is>`,
      to: emails?.join(','),
      replyTo: 'noreply@stjornartidindi.is',
      subject: `Mál ${publicationNumber} - ${caseToPublish?.advertType.title} ${caseToPublish?.advertTitle} hefur verið útgefið`,
      text: `Mál ${publicationNumber} hefur verið útgefið`,
      html: `<h2>Mál hefur verið útgefið:</h2><h3>${publicationNumber} - ${caseToPublish?.advertType.title} ${caseToPublish?.advertTitle}</h3><p><a href="https://island.is/stjornartidindi/nr/${advertCreateResult?.result.value.advert?.id}" target="_blank">Skoða auglýsingu</a></p>`,
    }

    if (caseToPublish.applicationId) {
      await this.utilityService.approveApplication(caseToPublish.applicationId)
    }
    try {
      await this.s3.sendMail(message, 'CaseService')
    } catch (error) {
      this.logger.error('Failed to send publish email', {
        error,
        publicationNumber: publicationNumber,
        category: LOGGING_CATEGORY,
      })
    }
    const maintypes = await this.advertMainTypeModel.findAll({
      where: {
        slug: {
          [Op.in]: REGULATION_TYPES,
        },
      },
      include: [AdvertTypeModel],
    })

    try {
      const advertId = advertCreateResult.result.value.advert.id
      transaction?.afterCommit(async () => {
        await this.runner.updateItemInIndex(advertId)
      })
    } catch (error) {
      this.logger.error('Failed to reindex advert', {
        error,
        advertId: advertCreateResult.result.value.advert.id,
        category: LOGGING_CATEGORY,
      })
    }

    //here we are going to post directly to regulations if the advert is in the correct category.
    const flatTypes = maintypes.flatMap((type) => {
      return type.types?.map((t) => t.slug) ?? []
    })

    if (flatTypes.includes(caseToPublish.advertType.slug)) {
      try {
        await this.externalService.publishRegulation(
          advertCreateResult.result.value.advert,
        )
      } catch (error) {
        this.logger.error('Failed to create regulation', {
          error,
          category: LOGGING_CATEGORY,
        })
      }
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle({ logArgs: false })
  async publishSingleRegulation(
    advertId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const advert = await this.journalService.getAdvert(advertId)

    if (!advert.result.ok) {
      this.logger.error('Single reg publish failed. Ad not found.', {
        error: advert.result.error,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Single reg publish failed. Ad not found.',
      })
    }

    const advertType = advert.result?.value?.advert?.type?.slug

    if (!advertType || !REGULATION_TYPES.includes(advertType)) {
      this.logger.error(
        'Single reg publish failed due to invalid advert type',
        {
          category: LOGGING_CATEGORY,
        },
      )
      return ResultWrapper.err({
        code: 500,
        message: 'Single reg publish failed. invalid advert type.',
      })
    }

    await this.externalService.publishRegulation(advert.result.value.advert)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCaseTags(): Promise<ResultWrapper<GetTagsResponse>> {
    const tags = await this.caseTagModel.findAll()

    const migrated = tags.map((tag) => caseTagMigrate(tag))

    return ResultWrapper.ok({
      tags: migrated,
    })
  }

  @LogAndHandle()
  async getCaseAvailableInvolvedParties(
    caseId: string,
  ): Promise<ResultWrapper<GetInstitutionsFullResponse>> {
    // Get the case to find current involved party
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['id', 'involvedPartyId'],
      include: [
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'nationalId'],
        },
      ],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    if (!caseLookup.involvedParty) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case has no involved party assigned',
      })
    }

    const currentNationalId = caseLookup.involvedParty.nationalId

    // Find all involved parties with the same national ID
    const parties =
      await this.utilityService.getInstitutionsByNationalId(currentNationalId)
    if (!parties.result.ok) {
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to get institutions',
      })
    }

    return ResultWrapper.ok({
      institutions: parties.result.value.institutions,
    })
  }

  @LogAndHandle()
  async updateCaseInvolvedParty(
    caseId: string,
    body: UpdateCaseInvolvedPartyBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const updateCase = await this.updateService.updateCaseInvolvedParty(
      caseId,
      body,
      transaction,
    )

    try {
      if (!updateCase.result.ok) {
        this.logger.warn('Failed to update case involved party', {
          error: updateCase.result.error,
          caseId,
          newInvolvedPartyId: body.involvedPartyId,
          category: LOGGING_CATEGORY,
        })
        return ResultWrapper.err({
          code: 500,
          message: 'Failed to update case involved party',
        })
      }
      const advertId = updateCase.result.value?.advertId
      if (advertId) {
        // Only update advert if advertId exists. That means the case is published.
        await this.journalService.updateAdvert(advertId, {
          involvedPartyId: body.involvedPartyId,
        })
      }
    } catch (error) {
      this.logger.warn('Failed to update advert involved party', {
        error,
        caseId,
        newInvolvedPartyId: body.involvedPartyId,
        category: LOGGING_CATEGORY,
      })
    }
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCasesWithStatusCount(
    status: CaseStatusEnum,
    params: GetCasesWithStatusCountQuery,
  ): Promise<ResultWrapper<GetCasesWithStatusCount>> {
    const statusesToBeCounted = params?.statuses ?? [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
      CaseStatusEnum.Published,
      CaseStatusEnum.Unpublished,
      CaseStatusEnum.Rejected,
    ]
    const whereParams = caseParameters(params)

    const counterResults = statusesToBeCounted.map((statusToBeCounted) => {
      return this.caseModel.count({
        distinct: true,
        benchmark: true,
        where: whereParams,
        include: casesIncludes({
          department: params?.department,
          type: params?.type,
          status: statusToBeCounted,
          institution: params?.institution,
          category: params?.category,
        }),
        logging: (_, timing) => {
          this.logger.info(
            `getCasesWithStatusCount counter for status ${statusToBeCounted} query executed in ${timing}ms`,
            {
              context: LOGGING_QUERY,
              category: LOGGING_CATEGORY,
              query: 'getCasesWithStatusCount',
            },
          )
        },
      })
    })

    const casesResults = this.getCasesSqlQuery({ ...params, status: [status] })

    const counter = (await Promise.all(counterResults)).map((count, index) => ({
      title: statusesToBeCounted[index],
      count: count,
    }))

    const cases = await casesResults

    const mappedCases = cases.rows.map((c) => caseMigrate(c))

    const paging = generatePaging(
      cases.rows,
      params?.page,
      params?.pageSize,
      cases.count,
    )

    const results = {
      statuses: counter.map((c) => ({
        status: c.title,
        count: c.count,
      })),
      cases: mappedCases,
      paging,
    }

    return ResultWrapper.ok(results)
  }

  /**
   * We do not use the transactional parameter here
   * because we want to use multiple transactions
   */
  @LogAndHandle()
  async createCaseByApplication(
    body: PostApplicationBody,
  ): Promise<ResultWrapper> {
    const { id } = ResultWrapper.unwrap(
      await this.createService.createCaseByApplication(body),
    )

    await this.createCaseHistory(id)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const channels = await this.caseChannelsModel.findAll({
      include: [CaseChannelModel],
      where: {
        caseId: id,
      },
    })

    const caseChannels = channels.map((c) => c.caseChannel)

    const additions = await this.caseAdditionsModel.findAll({
      where: {
        caseId: id,
      },
      include: [
        {
          model: CaseAdditionModel,
        },
      ],
      order: [['order', 'ASC']],
    })

    const caseLookup = await this.caseModel.findByPk(id, {
      include: [
        ...casesDetailedIncludes,
        {
          model: AdvertModel,
          include: [{ model: AdvertCorrectionModel, separate: true }],
        },
        {
          model: AdvertDepartmentModel,
        },
        {
          model: AdvertTypeModel,
          include: [
            { model: AdvertMainTypeModel, attributes: ['id', 'title', 'slug'] },
          ],
        },
        {
          model: AdvertCategoryModel,
        },
        {
          model: ApplicationAttachmentModel,
          where: {
            deleted: false,
          },
          required: false,
          include: [ApplicationAttachmentTypeModel],
        },
        {
          model: SignatureModel,
          include: [
            AdvertInvolvedPartyModel,
            {
              model: SignatureRecordModel,
              as: 'records',
              separate: true,
              include: [
                {
                  model: SignatureMemberModel,
                  as: 'chairman',
                },
                {
                  model: SignatureMemberModel,
                  as: 'members',
                  separate: true,
                  required: false,
                  include: [
                    {
                      model: SignatureRecordModel,
                      required: false,
                    },
                  ],
                  where: {
                    [Op.or]: [
                      // Exclude chairman using Sequelize.where
                      Sequelize.where(
                        Sequelize.col('SignatureMemberModel.id'),
                        Op.ne,
                        Sequelize.col('record.chairman_id'),
                      ),
                      // Include all members if chairman_id is NULL
                      Sequelize.where(
                        Sequelize.col('record.chairman_id'),
                        Op.is,
                        null,
                      ),
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    })

    if (!caseLookup) {
      throw new NotFoundException(`Case<${id}> not found`)
    }

    const caseAdditions = additions.map((a) => {
      return {
        id: a.caseAddition.id,
        title: a.caseAddition.title,
        content: a.caseAddition.content,
        type: a.caseAddition.type,
        CaseAdditionsModel: { order: a.order },
      }
    }) as CaseAdditionModel[]

    const returnableCase = {
      ...caseDetailedMigrate(caseLookup),
      channels: caseChannels
        ? caseChannels.map((c) => caseChannelMigrate(c))
        : [],
      additions: caseAdditions
        ? caseAdditions.map((add) => caseAdditionMigrate(add))
        : [],
    }

    return ResultWrapper.ok({
      case: returnableCase,
    })
  }

  @LogAndHandle()
  @Transactional()
  async postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['advertId'],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const { advertId } = caseLookup

    if (!advertId) {
      return ResultWrapper.err({
        code: 409,
        message: 'Advert id not found, case not published.',
      })
    }

    try {
      await this.advertCorrectionModel.create<AdvertCorrectionModel>(
        {
          ...body,
          advertId: advertId,
        },
        { transaction: transaction },
      )

      return ResultWrapper.ok()
    } catch (error) {
      return ResultWrapper.err({
        code: 400,
        message: 'Failed to create correction',
      })
    }
  }

  @LogAndHandle()
  @Transactional()
  async deleteCorrection(
    caseId: string,
    body: DeleteCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: ['advertId'],
    })

    if (!caseLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const { advertId } = caseLookup

    if (!advertId) {
      return ResultWrapper.err({
        code: 409,
        message: 'Advert id not found, case not published.',
      })
    }

    const correctionLookup = await this.advertCorrectionModel.findOne({
      where: {
        id: body.correctionId,
        advertId: advertId,
      },
      transaction,
    })

    if (!correctionLookup) {
      return ResultWrapper.err({
        code: 404,
        message: 'Correction not found for this case',
      })
    }

    await correctionLookup.destroy({ transaction })

    return ResultWrapper.ok({
      message: 'Correction deleted successfully',
    })
  }

  @LogAndHandle()
  async getCases(
    params: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesReponse>> {
    const cases = await this.getCasesSqlQuery(params)
    const mapped = cases.rows.map((c) => caseMigrate(c))

    return ResultWrapper.ok({
      cases: mapped,
      paging: generatePaging(mapped, params.page, params.pageSize, cases.count),
    })
  }

  @LogAndHandle()
  @Transactional()
  async rejectCase(caseId: string): Promise<ResultWrapper> {
    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Rejected)
    ).unwrap()

    const caseModel = await this.caseModel.findByPk(caseId)

    if (!caseModel) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const hasAdvertPromise = await this.casePublishedAdvertsModel.findOne({
      where: {
        caseId: caseId,
      },
    })

    const updateCasePromise = this.caseModel.update(
      {
        statusId: caseStatus.id,
      },
      {
        where: {
          id: caseId,
        },
      },
    )

    const [_, hasAdvert] = await Promise.all([
      updateCasePromise,
      hasAdvertPromise,
    ])

    if (!hasAdvert) {
      return ResultWrapper.ok()
    }

    const statusLookup = await this.utilityService.advertStatusLookup(
      AdvertStatus.Rejected,
    )

    if (!statusLookup.result.ok) {
      this.logger.error('Failed to get advert status', {
        error: statusLookup.result.error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to get advert status',
      })
    }

    const updateResult = await this.journalService.updateAdvert(
      hasAdvert.advertId,
      {
        statusId: statusLookup.result.value.id,
      },
    )

    if (!updateResult.result.ok) {
      this.logger.error('Failed to update advert status', {
        error: updateResult.result.error,
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Failed to update advert status',
      })
    }

    if (caseModel.applicationId) {
      await this.utilityService.rejectApplication(caseModel.applicationId)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getCasesWithDepartmentCount(
    department: DepartmentEnum,
    params: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>> {
    const whereParams = caseParameters(params)

    const departmentsToCount = [
      DepartmentEnum.A,
      DepartmentEnum.B,
      DepartmentEnum.C,
    ]

    const [counterA, counterB, counterC] = departmentsToCount.map(
      (department) => {
        return this.caseModel.count({
          distinct: true,
          benchmark: true,
          where: whereParams,
          include: casesIncludes({
            department: department,
            type: params?.type,
            status: params?.status,
            institution: params?.institution,
            category: params?.category,
          }),
          logging: (_, timing) =>
            this.logger.info(
              `getCasesWithDepartmentCount ${department} counter query ran in ${timing}ms`,
              {
                context: LOGGING_QUERY,
                category: LOGGING_CATEGORY,
                query: 'getCasesWithDepartmentCount',
              },
            ),
        })
      },
    )

    const casesResults = this.getCasesSqlQuery({
      ...params,
      department: [department],
    })

    const [cases, ...counters] = await Promise.all([
      casesResults,
      counterA,
      counterB,
      counterC,
    ])

    const counterResults = counters.map((counter, index) => ({
      department: departmentsToCount[index],
      count: counter,
    }))

    const mapped = cases.rows.map((c) => caseMigrate(c))
    const paging = generatePaging(
      cases.rows,
      params.page,
      params.pageSize,
      cases.count,
    )

    return ResultWrapper.ok({
      departments: counterResults,
      cases: mapped,
      paging,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getNextCasePublicationNumber(
    departmentId: string,
  ): Promise<ResultWrapper<GetNextPublicationNumberResponse>> {
    const publicationNumber = (
      await this.utilityService.getNextPublicationNumber(departmentId)
    ).unwrap()

    return ResultWrapper.ok({
      publicationNumber,
    })
  }

  private async processCaseToPublish(
    ids: string[],
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    for (const id of ids) {
      this.logger.info(`Publishing case<${id}>`, {
        id: id,
        context: 'CaseService',
        category: LOGGING_CATEGORY,
      })
      await this.publishCase(id, transaction)
    }

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async publishCases(
    body: PostCasePublishBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    return await this.processCaseToPublish(caseIds, transaction)
  }

  @LogAndHandle()
  @Transactional()
  async getCommunicationStatuses(): Promise<
    ResultWrapper<GetCommunicationSatusesResponse>
  > {
    const statuses = (await this.caseCommunicationStatusModel.findAll()).map(
      (s) => caseCommunicationStatusMigrate(s),
    )

    return ResultWrapper.ok({
      statuses,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getCaseAttachment(
    caseId: string,
    attachmentId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    const fileLocation = decodeURIComponent(attachment.fileLocation)

    const signedUrl = (await this.s3.getObject(fileLocation)).unwrap()

    return Promise.resolve(
      ResultWrapper.ok({ url: signedUrl, key: fileLocation }),
    )
  }

  @LogAndHandle()
  @Transactional()
  async updateSignatureDateDisplay(
    caseId: string,
    hide: boolean,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.utilityService.updateSignatureDateDisplay(
      caseId,
      hide,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  async getCasePaymentStatus(
    params: GetPaymentQuery,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetPaymentResponse>> {
    return await this.priceService.getExternalPaymentStatus(params)
  }

  @LogAndHandle()
  @Transactional()
  async overwriteCaseAttachment(
    caseId: string,
    attachmentId: string,
    incomingAttachment: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    // fetch the presigned url for the new attachment
    const fileKey = incomingAttachment.fileLocation?.split('/')
    const filePath = fileKey?.slice(0, fileKey.length - 1).join('/')
    const fileName = fileKey?.slice(fileKey.length - 1).join('/')
    const slugFileName = slugify(fileName ?? 'document.pdf', { lower: true })

    const sluggedBody = {
      ...incomingAttachment,
      fileLocation: `${filePath}/${slugFileName}`,
      originalFileName: fileName,
      fileName: slugFileName,
    }

    const signedUrl = (
      await this.s3.getPresignedUrl(sluggedBody.fileLocation)
    ).unwrap()

    // fetch the old attachment
    const { attachment } = (
      await this.attachmentService.getCaseAttachment(
        caseId,
        attachmentId,
        transaction,
      )
    ).unwrap()

    // mark the old attachment as deleted
    ResultWrapper.unwrap(
      await this.attachmentService.deleteAttachmentByKey(
        attachment.applicationId,
        attachment.fileLocation,
        transaction,
      ),
    )

    const attachmentType = enumMapper(attachment.type.slug, AttachmentTypeParam)

    if (!attachmentType) {
      throw new BadRequestException('Invalid attachment type')
    }

    // create the new attachment
    ResultWrapper.unwrap(
      await this.attachmentService.createAttachment({
        params: {
          caseId,
          applicationId: attachment.applicationId,
          attachmentType: attachmentType,
          body: sluggedBody,
        },
        transaction,
      }),
    )

    // return the presigned url for the client to upload the new attachment
    return ResultWrapper.ok({ url: signedUrl.url })
  }

  @LogAndHandle()
  @Transactional()
  async uploadAttachments(
    key: string,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const signedUrl = (await this.s3.getPresignedUrl(key)).unwrap()

    return Promise.resolve(
      ResultWrapper.ok({
        url: signedUrl.url,
        cdn: process.env.ADVERTS_CDN_URL,
      }),
    )
  }

  @LogAndHandle()
  @Transactional()
  async addApplicationAttachment(
    applicationId: string,
    type: AttachmentTypeParam,
    body: PostApplicationAttachmentBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<PresignedUrlResponse>> {
    const fileKey = body.fileLocation?.split('/')
    const filePath = fileKey?.slice(0, fileKey.length - 1).join('/')
    const fileName = fileKey?.slice(fileKey.length - 1).join('/')
    const slugFileName = slugify(fileName ?? 'document.pdf', { lower: true })

    const sluggedBody = {
      ...body,
      fileLocation: `${filePath}/${slugFileName}`,
      originalFileName: fileName,
      fileName: slugFileName,
    }

    const applicationAttachmentCreation = ResultWrapper.unwrap(
      await this.attachmentService.createAttachment({
        params: {
          applicationId: applicationId,
          attachmentType: type,
          body: sluggedBody,
        },
        transaction,
      }),
    )

    await this.attachmentService.createCaseAttachment(
      applicationId,
      applicationAttachmentCreation.id,
      transaction,
    )

    const signedUrl = (
      await this.s3.getPresignedUrl(sluggedBody.fileLocation)
    ).unwrap()

    return ResultWrapper.ok({
      url: signedUrl.url,
      attachmentId: applicationAttachmentCreation.id,
    })
  }
}
