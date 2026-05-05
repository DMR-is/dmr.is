import { Op, Order, WhereOptions } from 'sequelize'

import {
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

import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import {
  CompanySortByEnum,
  CompanySortDirectionEnum,
} from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { CompanyModel } from './models/company.model'
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
  ) {}

  async getAll(query: GetCompaniesQueryDto): Promise<GetCompaniesResponseDto> {
    const { limit, offset } = getLimitAndOffset(query)

    const where: WhereOptions = {}

    if (query.q) {
      const pattern = `%${query.q.trim()}%`
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.iLike]: pattern } },
          { nationalId: { [Op.iLike]: pattern } },
        ],
      })
    }

    if (query.minEmployeeCount !== undefined) {
      Object.assign(where, {
        averageEmployeeCountFromRsk: { [Op.gte]: query.minEmployeeCount },
      })
    }

    const sortCol =
      query.sortBy === CompanySortByEnum.EMPLOYEE_COUNT
        ? 'averageEmployeeCountFromRsk'
        : 'name'
    const sortDir = (
      query.direction ?? CompanySortDirectionEnum.ASC
    ).toUpperCase()
    const order: Order = [[sortCol, sortDir]]

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
      `Company "${id}" not found`,
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
        `No entity found in national registry for "${nationalId}"`,
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
        `Company with national id "${input.nationalId}" already exists`,
      )
    }

    const company = await this.companyModel.create({
      name: input.name,
      nationalId: input.nationalId,
      averageEmployeeCountFromRsk: input.averageEmployeeCountFromRsk,
    })

    return company.fromModel()
  }

  async getByNationalId(nationalId: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by national id "${nationalId}"`, {
      context: LOGGING_CONTEXT,
    })

    const company = await this.companyModel.findOneOrThrow(
      { where: { nationalId } },
      `Company with national id "${nationalId}" not found`,
    )

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
        `No entity found in national registry for "${input.nationalId}"`,
      )
    }

    const existingCompany = await this.companyModel.findOne({
      where: { nationalId: input.nationalId },
    })

    const company =
      existingCompany ??
      (await this.companyModel.create({
        name: registry.entity.nafn,
        nationalId: input.nationalId,
        averageEmployeeCountFromRsk: 0,
      }))

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
}
