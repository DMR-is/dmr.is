import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ICaseService } from './case.service.interface'
import {
  GetCasesQuery,
  GetCaseResponse,
  GetCasesReponse,
  CreateCaseDto,
  CreateCaseResponseDto,
  UpdateCaseBody,
} from '@dmr.is/official-journal/dto/case/case.dto'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { caseDetailedMigrate } from '@dmr.is/official-journal/migrations/case/case-detailed.migrate'
import { caseMigrate } from '@dmr.is/official-journal/migrations/case/case.migrate'
import { InjectModel } from '@nestjs/sequelize'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertTypeModel,
  CaseCommunicationStatusEnum,
  CaseCommunicationStatusModel,
  CaseModel,
  CaseStatusEnum,
  CaseStatusModel,
  CaseTagEnum,
  CaseTagModel,
} from '@dmr.is/official-journal/models'
import {
  generatePaging,
  getFastTrack,
  getLimitAndOffset,
  matchByIdTitleOrSlug,
  nextWeekdayAfterDays,
} from '@dmr.is/utils'
import { whereParams } from './utils'
import { Op } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { LogAndHandle } from '@dmr.is/decorators'

const LOGGING_CONTEXT = 'CaseService'
export const LOGGING_CATEGORY = 'case-service'

@Injectable()
export class CaseService implements ICaseService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseStatusModel)
    private readonly caseStatusModel: typeof CaseStatusModel,
    @InjectModel(CaseCommunicationStatusModel)
    private readonly caseCommunicationStatusModel: typeof CaseCommunicationStatusModel,
    @InjectModel(CaseTagModel)
    private readonly caseTagModel: typeof CaseTagModel,
  ) {}

  @LogAndHandle()
  private async generateInternalCaseNumber(): Promise<
    ResultWrapper<{ caseNumber: string }>
  > {
    const now = new Date().toISOString()
    const [year, month, date] = now.split('T')[0].split('-')

    const caseCount = await this.caseModel.count({
      distinct: true,
      col: 'CaseModel.id',
      where: {
        createdAt: {
          [Op.between]: [`${year}-${month}-${date} 00:00:00`, now],
        },
      },
    })

    const count = caseCount + 1

    const withLeadingZeros =
      count < 10 ? `00${count}` : count < 100 ? `0${count}` : count

    this.logger.debug(`Generated case number ${withLeadingZeros}`, {
      context: LOGGING_CONTEXT,
      category: LOGGING_CATEGORY,
      caseNumber: `${year}${month}${date}${withLeadingZeros}`,
    })

    return ResultWrapper.ok({
      caseNumber: `${year}${month}${date}${withLeadingZeros}`,
    })
  }

  @LogAndHandle()
  async getCase(id: string): Promise<ResultWrapper<GetCaseResponse>> {
    const caseLookup = await this.caseModel.scope('detailed').findByPk(id)

    if (!caseLookup) {
      throw new NotFoundException('Case not found')
    }

    return ResultWrapper.ok({ case: caseDetailedMigrate(caseLookup) })
  }

  @LogAndHandle()
  async getCases(
    params?: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesReponse>> {
    const { limit, offset } = getLimitAndOffset({
      page: params?.page,
      pageSize: params?.pageSize,
    })

    const whereClause = whereParams(params)

    const cases = await this.caseModel.findAndCountAll({
      limit,
      offset,
      where: whereClause,
      include: [
        {
          model: CaseStatusModel,
          attributes: ['id', 'title', 'slug'],
          where: matchByIdTitleOrSlug(params?.status),
        },
        {
          model: AdvertDepartmentModel,
          attributes: ['id', 'title', 'slug'],
          where: matchByIdTitleOrSlug(params?.department),
        },
        {
          model: AdvertTypeModel,
          attributes: ['id', 'title', 'slug', 'department_id'],
          include: [
            {
              attributes: ['id', 'title', 'slug'],
              model: AdvertDepartmentModel,
            },
          ],
          where: matchByIdTitleOrSlug(params?.type),
        },
        {
          model: AdvertInvolvedPartyModel,
          attributes: ['id', 'title', 'slug'],
          where: matchByIdTitleOrSlug(params?.institution),
        },
        {
          model: AdvertCategoryModel,
          attributes: ['id', 'title', 'slug'],
          where: matchByIdTitleOrSlug(params?.category),
          required: false,
        },
        {
          model: CaseCommunicationStatusModel,
          attributes: ['id', 'title', 'slug'],
        },
        {
          model: CaseTagModel,
          attributes: ['id', 'title', 'slug'],
        },
      ],
    })

    const paging = generatePaging(
      cases.rows,
      params?.page,
      params?.pageSize,
      cases.count,
    )
    const result = cases.rows.map((caseItem) => caseMigrate(caseItem))

    return ResultWrapper.ok({
      cases: result,
      paging,
    })
  }

  @LogAndHandle()
  async createCase(
    body: CreateCaseDto,
    currentUser: UserDto,
  ): Promise<ResultWrapper<CreateCaseResponseDto>> {
    const {
      departmentId,
      involvedPartyId,
      subject,
      typeId,
      applicationId,
      requestedPublicationDate,
    } = body

    const [status, tag, commStatus, caseNumberResults] = await Promise.all([
      this.caseStatusModel.findOne({
        where: body.caseStatusId
          ? { id: body?.caseStatusId }
          : {
              title: {
                [Op.eq]: CaseStatusEnum.Submitted,
              },
            },
      }),
      this.caseTagModel.findOne({ where: { title: CaseTagEnum.NotStarted } }),
      this.caseCommunicationStatusModel.findOne({
        where: body.communicationStatusId
          ? { id: body?.communicationStatusId }
          : {
              title: {
                [Op.eq]: CaseCommunicationStatusEnum.NotStarted,
              },
            },
      }),
      this.generateInternalCaseNumber(),
    ])

    if (!status) {
      this.logger.warn(`Case status not found when creating case`, {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        status: body.caseStatusId
          ? body.caseStatusId
          : CaseStatusEnum.Submitted,
      })
      throw new BadRequestException('Case status not found')
    }

    if (!tag) {
      this.logger.warn(`Case tag not found when creating case`, {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        tag: CaseTagEnum.NotStarted,
      })
      throw new BadRequestException('Case tag not found')
    }

    if (!commStatus) {
      this.logger.warn(
        `Case communication status not found when creating case`,
        {
          context: LOGGING_CONTEXT,
          category: LOGGING_CATEGORY,
          commStatus: body.communicationStatusId
            ? body.communicationStatusId
            : CaseCommunicationStatusEnum.NotStarted,
        },
      )
      throw new BadRequestException('Case communication status not found')
    }

    const { caseNumber } = ResultWrapper.unwrap(caseNumberResults)

    const now = new Date()
    const { fastTrack } = getFastTrack(
      body.requestedPublicationDate
        ? new Date(body.requestedPublicationDate)
        : now,
    )

    const fallBackhtml =
      '<h3 class="article__title">1. gr. </h3><p>Nýtt mál</p>'

    const createResults = await this.caseModel.create(
      {
        involvedPartyId: involvedPartyId,
        applicationId: applicationId,
        departmentId: departmentId,
        advertTitle: subject,
        advertTypeId: typeId,
        year: now.getFullYear(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        requestedPublicationDate: requestedPublicationDate
          ? requestedPublicationDate
          : nextWeekdayAfterDays(now, 10).toISOString(),
        statusId: status.id,
        communicationStatusId: commStatus.id,
        tagId: tag.id,
        fastTrack: fastTrack,
        assignedUserId: currentUser.id,
        html: body.html ? body.html : fallBackhtml,
        publishedAt: null,
        caseNumber: caseNumber,
        isLegacy: false,
      },
      { returning: ['id'] },
    )

    return ResultWrapper.ok({
      id: createResults.id,
    })
  }

  async updateCase(id: string, body: UpdateCaseBody): Promise<GetCaseResponse> {
    const caseLookup = await this.caseModel.scope('detailed').findByPk(id)

    if (!caseLookup) {
      throw new NotFoundException('Case not found')
    }

    const {
      applicationId,
      involvedPartyId,
      departmentId,
      subject,
      typeId,
      caseStatusId,
      communicationStatusId,
      requestedPublicationDate,
      html,
      assignedUserId,
      fastTrack,
    } = body

    await caseLookup.update({
      applicationId: applicationId,
      involvedPartyId: involvedPartyId,
      departmentId: departmentId,
      advertTitle: subject,
      advertTypeId: typeId,
      statusId: caseStatusId,
      communicationStatusId: communicationStatusId,
      requestedPublicationDate: requestedPublicationDate
        ? requestedPublicationDate
        : caseLookup.requestedPublicationDate,
      html: html ? html : caseLookup.html,
      assignedUserId: assignedUserId
        ? assignedUserId
        : caseLookup.assignedUserId,
      fastTrack: fastTrack,
      updatedAt: new Date().toISOString(),
    })

    const migratedCase = caseDetailedMigrate(caseLookup)

    return {
      case: migratedCase,
    }
  }
}
