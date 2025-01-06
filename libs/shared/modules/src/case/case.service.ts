import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import {
  AttachmentTypeParam,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertStatus,
  CaseCommunicationStatus,
  CaseOverviewQuery,
  CaseStatusEnum,
  CreateCaseChannelBody,
  GetCaseResponse,
  GetCasesOverview,
  GetCasesQuery,
  GetCasesReponse,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetPublishedCasesQuery,
  GetPublishedCasesResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateCaseBody,
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
import { PublishedCaseCounterResults, ResultWrapper } from '@dmr.is/types'
import {
  enumMapper,
  generatePaging,
  getLimitAndOffset,
  getS3Bucket,
} from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertTypeModel } from '../advert-type/models'
import { IAttachmentService } from '../attachments/attachment.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../attachments/models'
import { InstitutionModel } from '../institution/models/institution.model'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
} from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { IS3Service } from '../s3/s3.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { caseParameters } from './mappers/case-parameters.mapper'
import { caseMigrate } from './migrations/case.migrate'
import { caseCommunicationStatusMigrate } from './migrations/case-communication-status.migrate'
import { caseOverviewMigrate } from './migrations/case-overview.migrate'
import { caseOverviewStatusMigrate } from './migrations/case-overview-status.migrate'
import { caseTagMigrate } from './migrations/case-tag.migrate'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { ICaseService } from './case.service.interface'
import {
  CaseCommunicationStatusModel,
  CaseModel,
  CasePublishedAdvertsModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'
import { CASE_RELATIONS } from './relations'

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
    @Inject(forwardRef(() => IS3Service)) private readonly s3: IS3Service,

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

    @InjectModel(CasePublishedAdvertsModel)
    private readonly casePublishedAdvertsModel: typeof CasePublishedAdvertsModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  @LogAndHandle()
  @Transactional()
  async unpublishCase(id: string): Promise<ResultWrapper> {
    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Unpublished)
    ).unwrap()

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
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateEmployee(caseId, userId, transaction)
  }
  @LogAndHandle()
  @Transactional()
  updateCase(
    body: UpdateCaseBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCase(body, transaction)
  }
  @LogAndHandle()
  @Transactional()
  async updateCaseStatus(
    caseId: string,
    body: UpdateCaseStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    await this.updateService.updateCaseStatus(caseId, body, transaction)

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
    body: UpdateNextStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseNextStatus(caseId, body, transaction)
  }

  @LogAndHandle()
  @Transactional()
  updateCasePreviousStatus(
    caseId: string,
    body: UpdateNextStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCasePreviousStatus(
      caseId,
      body,
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
  updateCasePaid(
    caseId: string,
    body: UpdatePaidBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCasePaid(caseId, body, transaction)
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
    body: UpdateAdvertHtmlBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const [updatedCaseResult, hasAdvertResult] = await Promise.all([
      this.updateService.updateAdvert(caseId, body, transaction),
      this.casePublishedAdvertsModel.findOne({
        where: {
          caseId: caseId,
        },
      }),
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

    if (!hasAdvertResult) {
      return ResultWrapper.ok()
    }

    const updateResult = await this.journalService.updateAdvert(
      hasAdvertResult.advertId,
      {
        documentHtml: body.advertHtml,
      },
    )

    if (!updateResult.result.ok) {
      this.logger.error(
        `Failed to update advert<${hasAdvertResult.advertId}>, when updating case<${caseId}.html`,
        {
          caseId: caseId,
          advertId: hasAdvertResult.advertId,
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
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.createService.createCaseChannel(caseId, body, transaction)
  }

  @LogAndHandle({ logArgs: false })
  private async publishCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const activeCase = await this.caseModel.findByPk(caseId, {
      include: [...CASE_RELATIONS],
    })

    if (!activeCase) {
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }

    const now = new Date()

    const caseStatus = (
      await this.utilityService.caseStatusLookup(CaseStatusEnum.Published)
    ).unwrap()

    await this.caseModel.update(
      {
        statusId: caseStatus.id,
        publishedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    const number = (
      await this.utilityService.getNextPublicationNumber(
        activeCase.departmentId,
        transaction,
      )
    ).unwrap()

    const advertStatus = (
      await this.utilityService.advertStatusLookup(AdvertStatus.Published)
    ).unwrap()

    const signatureHtml = activeCase.signatures?.map((s) => s.html).join('')
    const advertPdf = await this.pdfService.getPdfByCaseId(caseId)

    if (!advertPdf.result.ok) {
      this.logger.warn('Failed to get pdf for case', {
        error: advertPdf.result.error,
        category: LOGGING_CATEGORY,
      })
    }

    const slug = activeCase.department.slug.replace('-deild', '').toUpperCase()
    const pdfFileName = `${slug}_nr_${number}_${activeCase.year}.pdf`
    if (advertPdf.result.ok) {
      const bucket = getS3Bucket()
      const key = `adverts/${pdfFileName}`
      const upload = await this.s3.uploadObject(
        bucket,
        key,
        pdfFileName,
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

    const advertCreateResult = await this.journalService.create(
      {
        departmentId: activeCase.departmentId,
        typeId: activeCase.advertTypeId,
        involvedPartyId: activeCase.involvedParty.id,
        categoryIds: activeCase.categories
          ? activeCase.categories.map((c) => c.id)
          : [],
        statusId: advertStatus.id,
        subject: activeCase.advertTitle,
        publicationNumber: number,
        publicationDate: now,
        signatureDate: now, // TODO: Replace with signature
        isLegacy: activeCase.isLegacy,
        documentHtml: activeCase.html + signatureHtml,
        documentPdfUrl: pdfFileName,
        attachments: [],
      },
      transaction,
    )

    if (!advertCreateResult.result.ok) {
      this.logger.error('Failed to create advert', {
        error: advertCreateResult.result.error,
        category: LOGGING_CATEGORY,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to create advert',
      })
    }

    const updatePromise = this.caseModel.update(
      {
        publicationNumber: number,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    const relationPromise = this.casePublishedAdvertsModel.create(
      {
        caseId: caseId,
        advertId: advertCreateResult.result.value.advert.id,
      },
      { transaction: transaction },
    )

    await Promise.all([updatePromise, relationPromise])

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
  async getCasesOverview(
    status?: string,
    params?: CaseOverviewQuery,
  ): Promise<ResultWrapper<GetCasesOverview>> {
    const availableStatuses = [
      CaseStatusEnum.Submitted,
      CaseStatusEnum.InProgress,
      CaseStatusEnum.InReview,
      CaseStatusEnum.ReadyForPublishing,
    ]

    const lowered = status?.toLowerCase()

    const currentStatus =
      availableStatuses.find((s) => s.toLowerCase() === lowered) ??
      CaseStatusEnum.Submitted

    const whereParams = caseParameters(params)

    const { limit, offset } = getLimitAndOffset({
      page: params?.page,
      pageSize: params?.pageSize,
    })

    const counterResults = availableStatuses.map((status) => {
      return this.caseModel.count({
        benchmark: true,
        where: whereParams,
        include: [
          {
            model: CaseStatusModel,
            where: {
              title: {
                [Op.eq]: status,
              },
            },
          },
        ],
        logging: (_, timing) => {
          this.logger.info(
            `getCaseOverview counter for status ${status} query executed in ${timing}ms`,
            {
              context: LOGGING_QUERY,
              category: LOGGING_CATEGORY,
              query: 'getCaseOverview',
            },
          )
        },
      })
    })

    const casesResults = this.caseModel.findAndCountAll({
      raw: true,
      nest: true,
      benchmark: true,
      offset: offset,
      limit: limit,
      attributes: [
        'id',
        'requestedPublicationDate',
        'createdAt',
        'advertTitle',
        'fastTrack',
        'publishedAt',
        'publicationNumber',
      ],
      where: whereParams,
      include: [
        {
          model: AdvertDepartmentModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertTypeModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: CaseCommunicationStatusModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          where: {
            title: {
              [Op.eq]: currentStatus,
            },
          },
        },
        {
          model: CaseTagModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
      logging: (_, timing) => {
        this.logger.info(
          `getCaseOverview get cases query executed in ${timing}ms`,
          {
            context: LOGGING_QUERY,
            category: LOGGING_CATEGORY,
            query: 'getCaseOverview',
          },
        )
      },
    })

    const counter = (await Promise.all(counterResults)).map((count, index) => ({
      title: availableStatuses[index],
      count,
    }))
    const cases = await casesResults

    const mappedCases = cases.rows.map((c) => caseOverviewMigrate(c))

    const paging = generatePaging(
      cases.rows,
      params?.page,
      params?.pageSize,
      cases.count,
    )

    return ResultWrapper.ok({
      statuses: counter.map((c) =>
        caseOverviewStatusMigrate({
          title: c.title,
          count: c.count,
        }),
      ),
      cases: mappedCases,
      paging,
    })
  }

  /**
   * We do not use the transactional parameter here
   * because we want to use multiple transactions
   */
  @LogAndHandle()
  createCase(body: PostApplicationBody): Promise<ResultWrapper> {
    return this.createService.createCase(body)
  }

  @LogAndHandle()
  async getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const caseLookup = await this.caseModel.findByPk(id, {
      include: [
        ...CASE_RELATIONS,
        {
          model: AdvertDepartmentModel,
        },
        {
          model: AdvertTypeModel,
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
      ],
    })

    if (!caseLookup) {
      throw new NotFoundException(`Case<${id}> not found`)
    }

    return ResultWrapper.ok({
      case: caseMigrate(caseLookup),
    })
  }

  @LogAndHandle()
  @Transactional()
  async getCases(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesReponse>> {
    const page = params?.page ?? DEFAULT_PAGE_NUMBER
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE

    const whereParams = caseParameters(params)

    const cases = await this.caseModel.findAndCountAll({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      where: whereParams,
      distinct: true,
      order: [['requestedPublicationDate', 'DESC']],
      include: [
        ...CASE_RELATIONS,
        {
          model: AdvertDepartmentModel,
          where: params?.department
            ? {
                slug: {
                  [Op.in]: params.department,
                },
              }
            : undefined,
        },
        {
          model: AdvertTypeModel,
          where: params?.type
            ? {
                slug: {
                  [Op.in]: params.type,
                },
              }
            : undefined,
        },
        {
          model: AdvertCategoryModel,
          where: params?.category
            ? {
                slug: {
                  [Op.in]: params.category,
                },
              }
            : undefined,
        },
        {
          model: CaseStatusModel,
          where: params?.status
            ? {
                [Op.or]: {
                  title: {
                    [Op.in]: params.status,
                  },
                  slug: {
                    [Op.in]: params.status,
                  },
                },
              }
            : undefined,
        },
      ],
    })

    const mapped = cases.rows.map((c) => caseMigrate(c))

    return ResultWrapper.ok({
      cases: mapped,
      paging: generatePaging(mapped, page, pageSize, cases.count),
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

    await this.utilityService.rejectApplication(caseModel.applicationId)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async getFinishedCases(
    department: string,
    params: GetPublishedCasesQuery,
  ): Promise<ResultWrapper<GetPublishedCasesResponse>> {
    const whereParams = {}

    if (params.search.length) {
      Object.assign(whereParams, {
        advertTitle: {
          [Op.like]: params.search,
        },
      })
    }

    const finishedStatuses = [
      CaseStatusEnum.Published,
      CaseStatusEnum.Rejected,
      CaseStatusEnum.Unpublished,
    ]

    const counterResultsPromise = this.caseModel.findAll({
      attributes: [
        [Sequelize.literal(`"department"."slug"`), 'departmentSlug'],
        [Sequelize.literal(`COUNT("CaseModel"."department_id")`), 'totalCases'],
      ],
      raw: true,
      offset: (params.page - 1) * params.pageSize,
      limit: params.pageSize,
      include: [
        {
          attributes: [],
          model: AdvertDepartmentModel,
          as: `department`,
        },
        {
          model: CaseStatusModel,
          attributes: [],
          where: {
            title: {
              [Op.in]: finishedStatuses,
            },
          },
        },
      ],
      where: whereParams,
      group: [`"department"."slug"`, `"department"."id"`],
      replacements: {
        department,
      },
    })

    const casesPromise = this.getCases({
      department: [department],
      status: finishedStatuses,
      page: params.page,
      pageSize: params.pageSize,
    })

    const [counterResults, casesLookup] = await Promise.all([
      counterResultsPromise,
      casesPromise,
    ])

    if (!casesLookup.result.ok) {
      this.logger.warn('Failed to get cases for published cases', {
        error: casesLookup.result.error,
        cateory: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 500,
        message: 'Internal server error',
      })
    }

    const totalCases = (
      counterResults as unknown as PublishedCaseCounterResults[]
    ).reduce(
      (r, current) => {
        const key = current.departmentSlug.split('-')[0]
        const value = parseInt(current.totalCases, 10)

        return {
          ...r,
          [key]: value,
        }
      },
      {
        a: 0,
        b: 0,
        c: 0,
      } as GetPublishedCasesResponse['totalCases'],
    )

    return ResultWrapper.ok({
      cases: casesLookup.result.value.cases,
      paging: casesLookup.result.value.paging,
      totalCases,
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
  ): Promise<ResultWrapper<undefined>> {
    const transaction = await this.sequelize.transaction()
    let success = true
    for (const id of ids) {
      this.logger.debug(`Publishing case<${id}>`, {
        id: id,
        category: LOGGING_CATEGORY,
      })
      const publishResult = await this.publishCase(id, transaction)

      if (!publishResult.result.ok) {
        this.logger.error(`Failed to publish case<${id}>`, {
          id: id,
          error: publishResult.result.error,
          category: LOGGING_CATEGORY,
        })
        success = false
        break
      }
    }

    if (!success) {
      this.logger.error('Failed to publish cases', {
        category: LOGGING_CATEGORY,
      })
      await transaction.rollback()
      return ResultWrapper.err({
        code: 500,
        message: 'Failed to publish cases',
      })
    }

    await transaction.commit()
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  async publishCases(
    body: PostCasePublishBody,
  ): Promise<ResultWrapper<undefined>> {
    const { caseIds } = body

    if (!caseIds || !caseIds.length) {
      throw new BadRequestException()
    }

    return await this.processCaseToPublish(caseIds)
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

    const signedUrl = (
      await this.s3.getObject(attachment.fileLocation)
    ).unwrap()

    return Promise.resolve(ResultWrapper.ok({ url: signedUrl }))
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

    const signedUrl = (
      await this.s3.getPresignedUrl(incomingAttachment.fileLocation)
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
          body: incomingAttachment,
        },
        transaction,
      }),
    )

    // return the presigned url for the client to upload the new attachment
    return ResultWrapper.ok({ url: signedUrl.url })
  }
}
