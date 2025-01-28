import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { AttachmentTypeParam } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AddCaseAdvertCorrection,
  AdminUser,
  AdvertStatus,
  Case,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseChannelBody,
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
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCasePublishBody,
  PresignedUrlResponse,
  UpdateAdvertHtmlBody,
  UpdateAdvertHtmlCorrection,
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
import { ResultWrapper } from '@dmr.is/types'
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
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertCorrectionModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
} from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { IS3Service } from '../s3/s3.service.interface'
import { SignatureModel } from '../signature/models'
import { IUtilityService } from '../utility/utility.service.interface'
import { caseParameters } from './mappers/case-parameters.mapper'
import { caseMigrate } from './migrations/case.migrate'
import { caseCommunicationStatusMigrate } from './migrations/case-communication-status.migrate'
import { caseDetailedMigrate } from './migrations/case-detailed.migrate'
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

    @InjectModel(AdvertCorrectionModel)
    private advertCorrectionModel: typeof AdvertCorrectionModel,

    @InjectModel(CasePublishedAdvertsModel)
    private readonly casePublishedAdvertsModel: typeof CasePublishedAdvertsModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
  }

  async getCasesSqlQuery(params: GetCasesQuery) {
    const whereParams = caseParameters(params)

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
      ],
      where: whereParams,
      include: casesIncludes({
        department: params?.department,
        type: params?.type,
        status: params?.status,
        institution: params?.institution,
        category: params?.category,
      }),
      order: [['requestedPublicationDate', 'ASC']],
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
    currentUser: AdminUser,
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
    currentUser: AdminUser,
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
    body: UpdateNextStatusBody,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseNextStatus(
      caseId,
      body,
      currentUser,
      transaction,
    )
  }

  @LogAndHandle()
  @Transactional()
  updateCasePreviousStatus(
    caseId: string,
    body: UpdateNextStatusBody,
    currentUser: AdminUser,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCasePreviousStatus(
      caseId,
      body,
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
    body: UpdateAdvertHtmlCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const { advertHtml, ...rest } = body

    const activeCase = await this.caseModel.findByPk(caseId, {
      include: [
        {
          model: AdvertModel,
          attributes: ['documentPdfUrl', 'id'],
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

    const now = new Date().toISOString()

    const docUrl = activeCase?.advert?.documentPdfUrl || `${caseId}_${now}.pdf` // Fallback to caseId if no url. Highly unlikely, but just in case.

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

    const pdfUrl = docUrl.replace('.pdf', `_${now}.pdf`)

    ResultWrapper.unwrap(await this.createPdfAndUpload(caseId, pdfUrl))
    const [updateAdvertCheck, postCaseCorrectionCheck] = await Promise.all([
      this.updateAdvertByHtml(
        caseId,
        { advertHtml, documentPdfUrl: pdfUrl },
        transaction,
      ),
      this.postCaseCorrection(
        caseId,
        {
          ...rest,
          documentHtml: advertHtml,
          documentPdfUrl: pdfUrl,
        },
        transaction,
      ),
    ])

    ResultWrapper.unwrap(updateAdvertCheck)
    ResultWrapper.unwrap(postCaseCorrectionCheck)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async updateAdvertByHtml(
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
        ...(body.documentPdfUrl && { documentPdfUrl: body.documentPdfUrl }),
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

  @LogAndHandle({ logArgs: false })
  private async createPdfAndUpload(
    caseId: string,
    fileName: string,
  ): Promise<ResultWrapper> {
    const advertPdf = await this.pdfService.generatePdfByCaseId(caseId)

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
      include: [...casesDetailedIncludes],
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

    const slug = activeCase.department.slug.replace('-deild', '').toUpperCase()
    const pdfFileName = `${slug}_nr_${number}_${activeCase.year}.pdf`

    await this.createPdfAndUpload(caseId, pdfFileName)

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
        advertId: advertCreateResult.result.value.advert.id,
      },
      {
        where: {
          id: caseId,
        },
        transaction: transaction,
      },
    )

    // TODO: Remove relation promise with casePublishedAdvertsModel removal
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

    return ResultWrapper.ok({
      statuses: counter.map((c) => ({
        status: c.title,
        count: c.count,
      })),
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
        ...casesDetailedIncludes,
        {
          model: AdvertModel,
          include: [AdvertCorrectionModel],
        },
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
      case: caseDetailedMigrate(caseLookup),
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
  @Transactional()
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
