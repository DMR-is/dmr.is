import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { AttachmentTypeParam, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertStatus,
  CaseCommunicationStatus,
  CaseStatusEnum,
  CreateCaseChannelBody,
  EditorialOverviewResponse,
  GetCaseResponse,
  GetCasesQuery,
  GetCasesReponse,
  GetCommunicationSatusesResponse,
  GetNextPublicationNumberResponse,
  GetTagsResponse,
  PostApplicationAttachmentBody,
  PostApplicationBody,
  PostCasePublishBody,
  PresignedUrlResponse,
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
import { enumMapper, generatePaging } from '@dmr.is/utils'

import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IAttachmentService } from '../attachments/attachment.service.interface'
import {
  ApplicationAttachmentModel,
  ApplicationAttachmentTypeModel,
} from '../attachments/models'
import { IJournalService } from '../journal'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertTypeModel,
} from '../journal/models'
import { IS3Service } from '../s3/s3.service.interface'
import { IUtilityService } from '../utility/utility.service.interface'
import { caseParameters } from './mappers/case-parameters.mapper'
import { caseMigrate } from './migrations/case.migrate'
import { caseCommunicationStatusMigrate } from './migrations/case-communication-status.migrate'
import { caseTagMigrate } from './migrations/case-tag.migrate'
import { ICaseCreateService } from './services/create/case-create.service.interface'
import { ICaseUpdateService } from './services/update/case-update.service.interface'
import { ICaseService } from './case.service.interface'
import { counterResult } from './case.utils'
import {
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusModel,
  CaseTagModel,
} from './models'
import { CASE_RELATIONS } from './relations'

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

    @Inject(ICaseUpdateService)
    private readonly updateService: ICaseUpdateService,

    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseTagModel)
    private readonly caseTagModel: typeof CaseTagModel,

    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
    private readonly sequelize: Sequelize,
  ) {
    this.logger.info('Using CaseService')
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
  updateCaseStatus(
    caseId: string,
    body: UpdateCaseStatusBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.updateService.updateCaseStatus(caseId, body, transaction)
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
  createCaseChannel(
    caseId: string,
    body: CreateCaseChannelBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    return this.createService.createCaseChannel(caseId, body, transaction)
  }

  @LogAndHandle({ logArgs: false })
  @Transactional()
  private async publishCase(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
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

    const activeCase = (await this.utilityService.caseLookup(caseId)).unwrap()

    const number = (
      await this.utilityService.getNextPublicationNumber(
        activeCase.departmentId,
        transaction,
      )
    ).unwrap()

    const advertStatus = (
      await this.utilityService.advertStatusLookup(AdvertStatus.Published)
    ).unwrap()

    await this.journalService.create(
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
        documentHtml: activeCase.html,
        documentPdfUrl: '', // TODO: Replace with pdf url and add advert attachments s3 keys
        attachments: [],
      },
      transaction,
    )

    ResultWrapper.unwrap(
      await this.utilityService.approveApplication(activeCase.applicationId),
    )

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
    params?: GetCasesQuery | undefined,
  ): Promise<ResultWrapper<EditorialOverviewResponse>> {
    const cases = (await this.getCases(params)).unwrap()

    const counter = await this.caseModel.findAll({
      attributes: [
        [Sequelize.literal(`status.title`), 'caseStatusTitle'],
        [Sequelize.fn('COUNT', Sequelize.col('status_id')), 'count'],
      ],
      include: [
        {
          model: CaseStatusModel,
          as: 'status',
          attributes: [],
        },
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
                slug: params?.category,
              }
            : undefined,
        },
      ],
      group: [
        'status_id',
        `status.title`,
        'department.id',
        'advertType.id',
        'categories.id',
        'CaseModel.id',
        'categories->CaseCategoriesModel.case_case_id',
        'categories->CaseCategoriesModel.category_id',
      ],
    })

    return ResultWrapper.ok({
      cases: cases.cases,
      paging: cases.paging,
      totalItems: counterResult(counter),
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
    const page = params?.page ? parseInt(params.page, 10) : 1
    const pageSize = params?.pageSize
      ? parseInt(params.pageSize, 10)
      : DEFAULT_PAGE_SIZE

    const statusLookups = params?.status?.map((s) => {
      return this.utilityService.caseStatusLookup(s)
    })
    const statusesRes = statusLookups
      ? await Promise.all(statusLookups).then((s) => s.map((ss) => ss.unwrap()))
      : undefined

    const statuses = statusesRes?.map((s) => s.id)

    const whereParams = caseParameters(params, statuses)

    const cases = await this.caseModel.findAndCountAll({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      where: whereParams,
      distinct: true,
      order: [['createdAt', 'DESC']],
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

    await Promise.all(
      caseIds.map(async (caseId) =>
        ResultWrapper.unwrap(await this.publishCase(caseId, transaction)),
      ),
    )

    return ResultWrapper.ok()
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
