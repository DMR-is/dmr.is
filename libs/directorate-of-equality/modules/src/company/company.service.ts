import { Includeable, literal, Op, Order, WhereOptions } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { INationalRegistryService } from '@dmr.is/clients-national-registry'
import {
  IRskCompanyRegistryService,
  LegalEntityDto,
  LegalFormDto,
} from '@dmr.is/clients-rsk-client'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils-server/serverUtils'

import { ICompanyCommentService } from '../company-comment/company-comment.service.interface'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { PostcodeModel } from '../location/models/postcode.model'
import { CompanyDto } from './dto/company.dto'
import { CompanyLookupDto } from './dto/company-lookup.dto'
import { CompanyRskPreviewDto } from './dto/company-rsk-preview.dto'
import {
  CompanyTimelineItemDto,
  CompanyTimelineItemKindEnum,
} from './dto/company-timeline-item.dto'
import {
  CompanySortByEnum,
  CompanySortDirectionEnum,
} from './dto/get-companies-query.dto'
import { GetCompaniesResponseDto } from './dto/get-companies-response.dto'
import { IsatCategoryDto } from './dto/isat-category.dto'
import { IsatSectionDto } from './dto/isat-section.dto'
import { SearchIsatCategoriesQueryDto } from './dto/search-isat-categories-query.dto'
import { UpdateCompanyEmailDto } from './dto/update-company-email.dto'
import { UpdateCompanyFinesDto } from './dto/update-company-fines.dto'
import { UpdateCompanyIsatDto } from './dto/update-company-isat.dto'
import { UpdateCompanyQuarantineDto } from './dto/update-company-quarantine.dto'
import { UpdateCompanySectorDto } from './dto/update-company-sector.dto'
import { UpdateCompanyStatusDto } from './dto/update-company-status.dto'
import {
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from './models/company.enums'
import { CompanyModel } from './models/company.model'
import { IsatCategoryModel } from './models/isat-category.model'
import { IsatSectionModel } from './models/isat-section.model'
import {
  buildCompanyExpiryWhere,
  buildCompanyIsatSectionInclude,
  buildCompanyIsatWhere,
  buildCompanyLocationInclude,
  buildCompanyOverdueWhere,
  buildCompanySectorWhere,
  buildCompanyStatusWhere,
} from './utils/filters'
import { ResolvedSector, resolveSector } from './utils/legal-form-sector'
import { mapRskLegalEntity } from './utils/rsk-company-mapping'
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
    @Inject(IRskCompanyRegistryService)
    private readonly rskCompanyRegistryService: IRskCompanyRegistryService,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(IsatCategoryModel)
    private readonly isatCategoryModel: typeof IsatCategoryModel,
    @InjectModel(IsatSectionModel)
    private readonly isatSectionModel: typeof IsatSectionModel,
    @InjectModel(PostcodeModel)
    private readonly postcodeModel: typeof PostcodeModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(ICompanyCommentService)
    private readonly companyCommentService: ICompanyCommentService,
  ) {}

  /**
   * `CompanyModel` scoped to also select the derived `reportStatus`. The cast
   * restores the custom `*OrThrow` statics that Sequelize's `.scope()` erases
   * from the return type.
   */
  private get companyWithReportStatus(): typeof CompanyModel {
    return this.companyModel.scope('withReportStatus') as typeof CompanyModel
  }

  /**
   * Re-read a company through the `withReportStatus` scope and map it to a DTO.
   * Used after a write (create) where the in-memory instance has no computed
   * `reportStatus` virtual yet.
   */
  private async loadCompanyDto(id: string): Promise<CompanyDto> {
    const company = await this.companyWithReportStatus.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    return company.fromModel()
  }

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

    if (query.finesStarted !== undefined) {
      conditions.push({ finesStarted: query.finesStarted })
    }

    if (query.quarantined !== undefined) {
      conditions.push({ quarantined: query.quarantined })
    }

    if (query.overdue) {
      conditions.push(buildCompanyOverdueWhere())
    }

    if (query.isatCategoryCode?.length) {
      conditions.push(buildCompanyIsatWhere(query.isatCategoryCode))
    }

    if (query.sector?.length) {
      conditions.push(buildCompanySectorWhere(query.sector))
    }

    const locationInclude = buildCompanyLocationInclude({
      postcodes: query.postcode,
      regionCodes: query.regionCode,
    })

    const isatSectionInclude = buildCompanyIsatSectionInclude(query.isatSection)

    const includes = [locationInclude, isatSectionInclude].filter(
      (include): include is Includeable => include !== null,
    )

    const where: WhereOptions =
      conditions.length === 0
        ? {}
        : conditions.length === 1
          ? conditions[0]
          : { [Op.and]: conditions }

    const sortDir = (
      query.direction ?? CompanySortDirectionEnum.ASC
    ).toUpperCase()
    let order: Order
    if (query.sortBy === CompanySortByEnum.EMPLOYEE_COUNT) {
      order = [
        [
          literal(
            `CASE employee_count_category WHEN 'UNKNOWN' THEN 0 WHEN 'SMALL' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LARGE' THEN 3 END`,
          ),
          sortDir,
        ],
      ]
    } else if (query.sortBy === CompanySortByEnum.NEXT_REPORT_DUE) {
      // Soonest (most overdue) of the two next-due dates first; companies with
      // no due date sort last regardless of direction.
      order = [
        literal(
          `LEAST(next_equality_report_due_at, next_salary_report_due_at) ${sortDir} NULLS LAST`,
        ),
      ]
    } else {
      order = [['name', sortDir]]
    }

    const { rows, count } = await this.companyWithReportStatus
      .findAndCountAll({
        where,
        order,
        limit,
        offset,
        distinct: true,
        col: 'id',
        ...(includes.length ? { include: includes } : {}),
      })

    const companies = rows.map((c) => c.fromModel())
    const paging = generatePaging(companies, query.page, query.pageSize, count)
    return { companies, paging }
  }

  async getById(id: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by id "${id}"`, {
      context: LOGGING_CONTEXT,
    })

    return this.loadCompanyDto(id)
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

    const enrichment = await this.resolveRskEnrichment(input.nationalId)

    // Guard: an inactive (deregistered) company must not be created. Only fires
    // when RSK was actually reached and reported inactive — a registry outage
    // leaves `status` unset (best-effort) and does not block creation.
    if (enrichment.status === CompanyStatusEnum.INACTIVE) {
      throw new BadRequestException(
        companyMessages.inactiveCannotCreate(input.nationalId),
      )
    }

    const company = await this.companyModel.create({
      name: input.name,
      nationalId: input.nationalId,
      employeeCountCategory: input.employeeCountCategory,
      ...enrichment,
    })

    await this.companyEventService.emitCreated(company.id, company.status)

    return this.loadCompanyDto(company.id)
  }

  /**
   * Best-effort enrichment from the RSK company registry, applied at creation.
   * Everything RSK can give us is mapped (address, postcode, ÍSAT, status);
   * `employeeCountCategory` is not derivable and stays as the admin-provided
   * value. A registry failure must never block company creation, so any error
   * degrades to no enrichment (the company is still created from the base
   * input). `postcode`/`isatCategoryCode` resolve against our reference tables
   * and fall back to null when the RSK value has no match.
   *
   * `sector` + `legalForm*` come from the same single RSK call — no extra
   * request on this path. `sectorOverride` is left alone here: creation never
   * counts as a manual admin classification.
   *
   * NOTE this is only one of three paths that create companies, and it is not
   * the one most companies arrive through:
   *
   * - `getOrCreateByNationalId` / `getOrCreateSubsidiaryReportSnapshotSource`
   *   auto-provision from the *national* registry, which carries no legal form,
   *   so they classify via `resolveSectorOnly` — one extra RSK call, and
   *   deliberately no `status` (see there).
   * - `CompanyImportService` bulk-inserts the annual workbook without touching
   *   RSK at all. Those rows are born UNKNOWN and stay that way. This is a
   *   decision, not an oversight: RSK has no bulk endpoint (only
   *   `GET /{nationalId}`), the workbook carries no legal-form column, and
   *   `reconcile` runs for both preview and apply — so per-row lookups would
   *   mean thousands of HTTP calls, twice per import. An RSK sweep task was
   *   considered and ruled out.
   *
   * The existing backlog is instead planned to be classified by a one-off bulk
   * SQL `UPDATE` (ÍSAT section O is the sensible basis — high precision for
   * public administration, low recall) plus `updateSector` for the tail. So
   * "every new company is sector-classified" is NOT true; do not write code
   * that assumes it, and do not expect an automated backfill to arrive.
   */
  private async resolveRskEnrichment(nationalId: string): Promise<{
    status?: CompanyStatusEnum
    address?: string | null
    postcodeId?: string | null
    isatCategoryCode?: string | null
    sector?: CompanySectorEnum
    legalFormId?: string | null
    legalFormName?: string | null
  }> {
    const entity = await this.tryGetRskLegalEntity(
      nationalId,
      'creating from base input only',
    )

    if (!entity) {
      return {}
    }

    const mapped = mapRskLegalEntity(entity)

    const [postcode, isatCategory] = await Promise.all([
      this.resolvePostcode(mapped.postcodeCode),
      this.resolveIsatCategory(mapped.isatCode),
    ])

    const resolvedSector = this.resolveSectorLogged(
      nationalId,
      entity.legalForm,
    )

    return {
      status: mapped.status,
      address: mapped.address,
      postcodeId: postcode?.id ?? null,
      isatCategoryCode: isatCategory?.code ?? null,
      sector: resolvedSector.sector,
      legalFormId: resolvedSector.legalFormId,
      legalFormName: resolvedSector.legalFormName,
    }
  }

  /**
   * Fetch an RSK legal entity for a creation path, returning null instead of
   * throwing. Every caller is about to write a company row, and a registry
   * outage must degrade the row rather than block the write — `whenSkipped`
   * says what the caller falls back to, for the log line.
   */
  private async tryGetRskLegalEntity(
    nationalId: string,
    whenSkipped: string,
  ): Promise<LegalEntityDto | null> {
    try {
      return await this.rskCompanyRegistryService.getLegalEntityByNationalId(
        nationalId,
      )
    } catch (error) {
      this.logger.warn(
        `RSK lookup failed for national id "${nationalId}"; ${whenSkipped}`,
        { context: LOGGING_CONTEXT, error },
      )
      return null
    }
  }

  /**
   * Sector classification for the auto-provisioning paths, which create a
   * company from the *national registry* — that response carries no legal form,
   * so unlike `create` this genuinely costs one extra RSK call.
   *
   * Deliberately narrower than `resolveRskEnrichment`: it takes only the
   * sector, not RSK's `status`. These paths auto-provision a company so an
   * incoming application or report can be filed against it, and an RSK record
   * reading "Afskráð" would otherwise create it INACTIVE and block the very
   * submission that triggered the provisioning. Classifying ownership is safe;
   * inheriting lifecycle state on this path is not.
   *
   * Best-effort throughout: an unreachable registry, no RSK record, or a legal
   * form we do not map all yield UNKNOWN, which an admin can correct by hand
   * later. `sectorOverride` stays false — nothing here is an admin decision.
   */
  private async resolveSectorOnly(nationalId: string): Promise<{
    sector: CompanySectorEnum
    legalFormId: string | null
    legalFormName: string | null
  }> {
    const entity = await this.tryGetRskLegalEntity(
      nationalId,
      'auto-provisioned company left unclassified',
    )

    if (!entity) {
      return {
        sector: CompanySectorEnum.UNKNOWN,
        legalFormId: null,
        legalFormName: null,
      }
    }

    const resolved = this.resolveSectorLogged(nationalId, entity.legalForm)

    return {
      sector: resolved.sector,
      legalFormId: resolved.legalFormId,
      legalFormName: resolved.legalFormName,
    }
  }

  /**
   * Derive the ownership sector and log any legal form we could not map. The
   * mapping table is inferred rather than confirmed against live payloads, so
   * these log lines are how the real RSK vocabulary surfaces — each one names a
   * key to add to `LEGAL_FORM_SECTOR`. Unmapped forms stay UNKNOWN; they are
   * never guessed as PRIVATE.
   */
  private resolveSectorLogged(
    nationalId: string,
    legalForm: LegalFormDto | null,
  ): ResolvedSector {
    const resolved = resolveSector(legalForm)

    // Gate on `!== null`, not truthiness: an empty array is impossible here,
    // but a key that normalizes to '' is not, and that is exactly the case
    // worth seeing rather than swallowing.
    if (resolved.unmappedKeys !== null) {
      this.logger.warn(
        `Unmapped RSK legal form ${resolved.unmappedKeys
          .map((key) => `"${key}"`)
          .join(' / ')} for national id "${nationalId}"; sector left UNKNOWN`,
        {
          context: LOGGING_CONTEXT,
          unmappedLegalFormKeys: resolved.unmappedKeys,
          legalFormId: resolved.legalFormId,
          legalFormName: resolved.legalFormName,
        },
      )
    }

    return resolved
  }

  /**
   * Read-only preview of the RSK-derived company fields, backing the create
   * screen so the admin sees exactly what will be stored before submitting.
   * Unlike `create`, a registry failure surfaces to the caller (the admin is
   * actively looking the company up). `postcode`/`isatCategory` are the
   * human-readable forms of the values `create` persists — null when the RSK
   * value has no match in our reference tables (and so would not be stored).
   */
  async getRskCompanyPreview(
    nationalId: string,
  ): Promise<CompanyRskPreviewDto> {
    this.logger.debug(
      `Previewing RSK company registry data for national id "${nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    const entity =
      await this.rskCompanyRegistryService.getLegalEntityByNationalId(
        nationalId,
      )

    const mapped = mapRskLegalEntity(entity)

    const [postcode, isatCategory] = await Promise.all([
      this.resolvePostcode(mapped.postcodeCode),
      this.resolveIsatCategory(mapped.isatCode),
    ])

    // Same single RSK call `create` uses — no extra request. Logged too, so an
    // admin looking a company up also surfaces the unmapped form.
    const resolvedSector = this.resolveSectorLogged(
      nationalId,
      entity.legalForm,
    )

    return {
      name: entity.name,
      nationalId: entity.nationalId,
      status: mapped.status,
      statusReason: mapped.statusReason,
      address: mapped.address,
      postcode: postcode
        ? `${postcode.code} ${postcode.place}`
        : mapped.postcodeCode,
      isatCategory: isatCategory
        ? `${isatCategory.codeDotted} ${isatCategory.description}`
        : null,
      sector: resolvedSector.sector,
      legalFormName: resolvedSector.legalFormName,
    }
  }

  /** Resolve an RSK 3-digit postcode to our `postcode` row, or null if unknown. */
  private async resolvePostcode(
    code: string | null,
  ): Promise<PostcodeModel | null> {
    if (!code) {
      return null
    }

    return this.postcodeModel.findOne({ where: { code } })
  }

  /**
   * Resolve an RSK ÍSAT code against the ÍSAT2008 reference table. Returns the
   * row only when it exists (the company FK rejects unknown codes), else null.
   */
  private async resolveIsatCategory(
    code: string | null,
  ): Promise<IsatCategoryModel | null> {
    if (!code) {
      return null
    }

    return this.isatCategoryModel.findByPk(code)
  }

  async getByNationalId(nationalId: string): Promise<CompanyDto> {
    this.logger.debug(`Looking up company by national id "${nationalId}"`, {
      context: LOGGING_CONTEXT,
    })

    const company = await this.companyWithReportStatus.findOneOrThrow(
      { where: { nationalId } },
      companyMessages.notFoundByNationalId(nationalId),
    )

    return company.fromModel()
  }

  async getOrCreateByNationalId(
    nationalId: string,
    fallbackName?: string,
  ): Promise<CompanyDto> {
    const existing = await this.companyWithReportStatus
      .findOne({ where: { nationalId } })

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

    const resolvedSector = await this.resolveSectorOnly(nationalId)

    const company = await this.companyModel.create({
      name,
      nationalId,
      employeeCountCategory: CompanySizeEnum.UNKNOWN,
      sector: resolvedSector.sector,
      legalFormId: resolvedSector.legalFormId,
      legalFormName: resolvedSector.legalFormName,
    })

    await this.companyEventService.emitCreated(company.id, company.status)

    return this.loadCompanyDto(company.id)
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
      const resolvedSector = await this.resolveSectorOnly(input.nationalId)

      company = await this.companyModel.create({
        name: registry.entity.nafn,
        nationalId: input.nationalId,
        employeeCountCategory: CompanySizeEnum.UNKNOWN,
        sector: resolvedSector.sector,
        legalFormId: resolvedSector.legalFormId,
        legalFormName: resolvedSector.legalFormName,
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
    // Scoped read so the returned DTO carries reportStatus. The company's
    // status column does not feed reportStatus, so the value loaded here stays
    // correct after the update below.
    const company = await this.companyWithReportStatus.findOneOrThrow(
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
   * Toggle the daily-fines flag. The fines process itself is handled outside
   * this system — the flag just records that it is in progress. Both
   * transitions emit a `company_event` (with optional reason) for audit.
   */
  async updateFines(
    id: string,
    dto: UpdateCompanyFinesDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyWithReportStatus.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    // No-op when the flag is unchanged — avoids a spurious timeline event.
    if (company.finesStarted === dto.finesStarted) {
      return company.fromModel()
    }

    this.logger.info(
      `Updating company ${id} fines flag: ${company.finesStarted} → ${dto.finesStarted}`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ finesStarted: dto.finesStarted })

    if (dto.finesStarted) {
      await this.companyEventService.emitFinesStarted(
        id,
        company.status,
        actorUserId,
        dto.reason ?? null,
      )
    } else {
      await this.companyEventService.emitFinesStopped(
        id,
        company.status,
        actorUserId,
        dto.reason ?? null,
      )
    }

    return company.fromModel()
  }

  /**
   * Quarantine a company — an admin halt switch. While quarantined, every
   * outbound touchpoint (scheduled jobs, emails, notifications) must skip the
   * company. Purely manual; both transitions emit a `company_event` (with
   * optional reason) for audit.
   */
  async updateQuarantine(
    id: string,
    dto: UpdateCompanyQuarantineDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyWithReportStatus.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    // No-op when the flag is unchanged — avoids a spurious timeline event.
    if (company.quarantined === dto.quarantined) {
      return company.fromModel()
    }

    this.logger.info(
      `Updating company ${id} quarantine: ${company.quarantined} → ${dto.quarantined}`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ quarantined: dto.quarantined })

    if (dto.quarantined) {
      await this.companyEventService.emitQuarantined(
        id,
        company.status,
        actorUserId,
        dto.reason ?? null,
      )
    } else {
      await this.companyEventService.emitUnquarantined(
        id,
        company.status,
        actorUserId,
        dto.reason ?? null,
      )
    }

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

  /**
   * Admin-set contact email read by the report-deadline-reminder task. Empty
   * string is normalized to null (clears it). No timeline event — the reminder
   * task's NO_EMAIL event already records the gap this fills.
   */
  async updateEmail(
    id: string,
    dto: UpdateCompanyEmailDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyWithReportStatus.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    const email = dto.email?.trim() || null

    if (company.email === email) {
      return company.fromModel()
    }

    this.logger.info(
      `Updating company ${id} email: ${company.email ?? '∅'} → ${
        email ?? '∅'
      } (by ${actorUserId})`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ email })

    return company.fromModel()
  }

  /**
   * Manually set the ownership sector. This is the admin's escape hatch for the
   * companies automatic classification could not place — either RSK was never
   * consulted for them (the pre-existing backlog) or it returned a legal form
   * `LEGAL_FORM_SECTOR` does not map.
   *
   * The override rule, chosen so admins have a natural undo:
   *   PRIVATE | PUBLIC → `sectorOverride = true`. A deliberate human decision;
   *       a backfill must leave the row alone from here on.
   *   UNKNOWN          → `sectorOverride = false`. Reads as "I can't classify
   *       this either", so it hands the company back to automatic
   *       classification rather than pinning it as permanently unclassifiable.
   *
   * The raw `legalForm*` values are left untouched — they are RSK's data, not
   * ours, and keeping them lets a corrected mapping be re-derived later.
   *
   * Audited via a structured log line rather than a `company_event`, matching
   * `updateIsat`: sector is admin-owned classification data, not part of the
   * company's regulatory timeline.
   */
  async updateSector(
    id: string,
    dto: UpdateCompanySectorDto,
    actorUserId: string,
  ): Promise<CompanyDto> {
    const company = await this.companyModel.findOneOrThrow(
      { where: { id } },
      companyMessages.notFound(id),
    )

    const override = dto.sector !== CompanySectorEnum.UNKNOWN

    if (
      company.sector === dto.sector &&
      company.sectorOverride === override
    ) {
      return this.loadCompanyDto(id)
    }

    this.logger.info(
      `Updating company ${id} sector: ${company.sector} → ${dto.sector} (override ${company.sectorOverride} → ${override}, by ${actorUserId})`,
      { context: LOGGING_CONTEXT },
    )

    await company.update({ sector: dto.sector, sectorOverride: override })

    return this.loadCompanyDto(id)
  }

  /**
   * Backs the ÍSAT filter picker. With `codes`, returns those exact leaf codes;
   * with `q`, returns matches across code and descriptions; with neither, the
   * full ÍSAT2008 list (~665 leaf codes) — small enough to load once and search
   * client-side. Always ordered by code, unbounded.
   */
  async searchIsatCategories(
    query: SearchIsatCategoriesQueryDto,
  ): Promise<IsatCategoryDto[]> {
    if (query.codes?.length) {
      const byCode = await this.isatCategoryModel.findAll({
        where: { code: { [Op.in]: query.codes } },
        order: [['code', 'ASC']],
      })
      return byCode.map((category) => category.fromModel())
    }

    const term = query.q?.trim()
    const pattern = term ? `%${term}%` : null

    const rows = await this.isatCategoryModel.findAll({
      order: [['code', 'ASC']],
      ...(pattern
        ? {
            where: {
              [Op.or]: [
                { code: { [Op.iLike]: pattern } },
                { codeDotted: { [Op.iLike]: pattern } },
                { description: { [Op.iLike]: pattern } },
                { descriptionEn: { [Op.iLike]: pattern } },
              ],
            },
          }
        : {}),
    })

    return rows.map((category) => category.fromModel())
  }

  /**
   * Backs the premade industry filter: the 22 ÍSAT2008 sections (bálkar) with
   * their labels, so the admin UI can offer "Opinber stjórnsýsla" as one choice
   * instead of every leaf code under division 84. Static reference data —
   * unbounded and ordered by letter, so X (Óþekkt starfsemi) sorts last.
   */
  async listIsatSections(): Promise<IsatSectionDto[]> {
    const rows = await this.isatSectionModel.findAll({
      order: [['code', 'ASC']],
    })

    return rows.map((section) => section.fromModel())
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
