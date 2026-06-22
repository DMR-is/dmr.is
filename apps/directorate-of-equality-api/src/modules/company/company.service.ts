import { literal, Op, Order, WhereOptions } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { INationalRegistryService } from '@dmr.is/clients-national-registry'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import { ICompanyCommentService } from '../company-comment/company-comment.service.interface'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import {
  CompanyTimelineItemDto,
  CompanyTimelineItemKindEnum,
} from './dto/company-timeline-item.dto'
import {
  CompanySortByEnum,
  CompanySortDirectionEnum,
} from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { UpdateCompanyIsatDto } from './dto/update-company-isat.dto'
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto'
import { CompanySizeEnum } from './models/company.enums'
import { CompanyModel } from './models/company.model'
import { IsatCategoryModel } from './models/isat-category.model'
import { buildCompanyExpiryWhere, buildCompanyStatusWhere } from './utils/filters'
import { companyMessages } from './company.messages'
import {
  CreateCompanyInput,
  GetCompaniesQueryDto,
  ICompanyService,
  SubsidiaryReportSnapshotLookup,
  SubsidiaryReportSnapshotSourceDto,
} from './company.service.interface'

const LOGGING_CONTEXT = 'CompanyService'

@Injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(INationalRegistryService)
    private readonly nationalRegistryService: INationalRegistryService,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(IsatCategoryModel)
    private readonly isatCategoryModel: typeof IsatCategoryModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(ICompanyCommentService)
    private readonly companyCommentService: ICompanyCommentService,
  ) {}

  async getAll(query: GetCompaniesQueryDto): Promise<GetCompaniesResponseDto> {
    const { limit, offset } = getLimitAndOffset(query)

    const conditions: WhereOptions[] = []

    if (query.q) {
      const pattern = `%${query.q.trim()}%`
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: pattern } },
          { nationalId: { [Op.iLike]: pattern } },
        ],
      })
    }

    if (query.employeeCountCategory !== undefined) {
      conditions.push({ employeeCountCategory: query.employeeCountCategory })
    }

    if (query.companyStatus?.length) {
      conditions.push(buildCompanyStatusWhere(query.companyStatus))
    }

    if (query.expiresWithin?.length) {
      conditions.push(buildCompanyExpiryWhere(query.expiresWithin))
    }

    const where: WhereOptions =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : { [Op.and]: conditions }

    const sortDir = (
      query.direction ?? CompanySortDirectionEnum.ASC
    ).toUpperCase()
    const order: Order =
      query.sortBy === CompanySortByEnum.EMPLOYEE_COUNT
        ? [
            [
              literal(
                `CASE employee_count_category WHEN 'UNKNOWN' THEN 0 WHEN 'SMALL' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LARGE' THEN 3 END`,
              ),
              sortDir,
            ],
          ]
        : [['name', sortDir]]

    const { rows, count } = await this.companyModel.findAndCountAll({
      where,
      order,
      limit,
      offset,
      distinct: true,
      col: 'id',
    })

    const companies = rows.map((c) => c.fromModel())
    const paging = generatePaging(companies, query.page, query.pageSize, count)
    return { companies, paging }
  }

  async getById(id: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by id "${id}"`, {
      context: LOGGING_CONTEXT,
    })

    const company = await this.companyModel.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    return company.fromModel()
  }

  async rskLookup(nationalId: string): Promise<CompanyLookupDto> {
    this.logger.debug(
      `Looking up company in national registry by national id "${nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const result =
      await this.nationalRegistryService.getEntityByNationalId(nationalId)

    if (!result.entity) {
      throw new NotFoundException(
        companyMessages.registryEntityNotFound(nationalId),
      )
    }

    return { name: result.entity.nafn, nationalId: result.entity.kennitala }
  }

  async create(input: CreateCompanyInput): Promise<CompanyDto> {
    this.logger.info(
      `Creating company with national id "${input.nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const existing = await this.companyModel.findOne({
      where: { nationalId: input.nationalId },
    })

    if (existing) {
      throw new ConflictException(
        companyMessages.alreadyExists(input.nationalId),
      )
    }

    const company = await this.companyModel.create({
      name: input.name,
      nationalId: input.nationalId,
      employeeCountCategory: input.employeeCountCategory,
    })

    await this.companyEventService.emitCreated(company.id, company.status)

    return company.fromModel()
  }

  async getByNationalId(nationalId: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by national id "${nationalId}"`, {
      context: LOGGING_CONTEXT,
    })

    const company = await this.companyModel.findOneOrThrow(
      { where: { nationalId } },
      companyMessages.notFoundByNationalId(nationalId),
    )

    return company.fromModel()
  }

  async getOrCreateByNationalId(
    nationalId: string,
    fallbackName?: string,
  ): Promise<CompanyDto> {
    const existing = await this.companyModel.findOne({
      where: { nationalId },
    })

    if (existing) {
      return existing.fromModel()
    }

    const registry =
      await this.nationalRegistryService.getEntityByNationalId(nationalId)

    const name = registry.entity?.nafn ?? fallbackName

    if (!name) {
      throw new NotFoundException(
        companyMessages.registryEntityNotFoundNoFallback(nationalId),
      )
    }

    this.logger.info(
      `Auto-provisioning company with national id "${nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const company = await this.companyModel.create({
      name,
      nationalId,
      employeeCountCategory: CompanySizeEnum.UNKNOWN,
    })

    await this.companyEventService.emitCreated(company.id, company.status)

    return company.fromModel()
  }

  async getOrCreateSubsidiaryReportSnapshotSource(
    input: SubsidiaryReportSnapshotLookup,
  ): Promise<SubsidiaryReportSnapshotSourceDto> {
    this.logger.debug(
      `Resolving report company snapshot source by national id "${input.nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const registry = await this.nationalRegistryService.getEntityByNationalId(
      input.nationalId,
    )

    if (!registry.entity) {
      throw new NotFoundException(
        companyMessages.registryEntityNotFound(input.nationalId),
      )
    }

    const existingCompany = await this.companyModel.findOne({
      where: { nationalId: input.nationalId },
    })

    let company = existingCompany
    if (!company) {
      company = await this.companyModel.create({
        name: registry.entity.nafn,
        nationalId: input.nationalId,
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
      })
      await this.companyEventService.emitCreated(company.id, company.status)
    }

    return {
      companyId: company.id,
      name: company.name,
      nationalId: company.nationalId,
      address: registry.entity.heimili,
      city: registry.entity.sveitarfelag,
      postcode: registry.entity.postaritun,
      isatCategory: '',
    }
  }

  async updateStatus(
    id: string,
    dto: UpdateCompanyStatusDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyModel.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    // No-op when the status is unchanged — avoids a spurious STATUS_CHANGED
    // event with from === to (which the DB check constraint would anyway need).
    if (company.status === dto.status) {
      return company.fromModel()
    }

    const fromStatus = company.status

    this.logger.info(
      `Updating company ${id} status: ${fromStatus} → ${dto.status}`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ status: dto.status })
    await this.companyEventService.emitStatusChanged(
      id,
      fromStatus,
      dto.status,
      actorUserId,
      dto.reason ?? null,
    )

    return company.fromModel()
  }

  /**
   * Admin-owned ÍSAT2008 classification (statistics data). Independent of the
   * report-submission snapshot — see db/README.md. Pass `isatCategoryCode: null`
   * to clear. The FK also guards bad codes; we validate up-front for a clean 400.
   */
  async updateIsat(
    id: string,
    dto: UpdateCompanyIsatDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyModel.findOneOrThrow(
      { where: { id } },
      `Company "${id}" not found`,
    )

    const code = dto.isatCategoryCode ?? null

    if (code !== null) {
      const category = await this.isatCategoryModel.findByPk(code)
      if (!category) {
        throw new BadRequestException(`Unknown ÍSAT2008 code "${code}"`)
      }
    }

    this.logger.info(
      `Updating company ${id} ÍSAT: ${company.isatCategoryCode ?? '∅'} → ${
        code ?? '∅'
      } (by ${actorUserId})`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ isatCategoryCode: code })

    const updated = await this.companyModel.findOneOrThrow({
      where: { id },
      include: [{ model: IsatCategoryModel, as: 'isatCategory' }],
    })

    return updated.fromModel()
  }

  async getTimeline(id: string): Promise<CompanyTimelineItemDto[]> {
    await this.companyModel.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    const [events, comments] = await Promise.all([
      this.companyEventService.getByCompanyId(id),
      this.companyCommentService.getByCompanyId(id),
    ])

    const eventItems: CompanyTimelineItemDto[] = events.map((event) => ({
      kind: CompanyTimelineItemKindEnum.EVENT,
      createdAt: event.createdAt,
      event,
      comment: null,
    }))

    const commentItems: CompanyTimelineItemDto[] = comments.map((comment) => ({
      kind: CompanyTimelineItemKindEnum.COMMENT,
      createdAt: comment.createdAt,
      event: null,
      comment,
    }))

    return [...eventItems, ...commentItems].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )
  }
}
