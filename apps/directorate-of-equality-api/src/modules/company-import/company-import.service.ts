import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { IsatCategoryModel } from '../company/models/isat-category.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { PostcodeModel } from '../location/models/postcode.model'
import {
  CompanyImportErrorDto,
  CompanyImportFieldChangeDto,
  CompanyImportOutcomeEnum,
  CompanyImportResultDto,
  CompanyImportRowResultDto,
} from './dto/company-import-result.dto'
import { ParsedCompanyRow } from './dto/parsed-company-row.dto'
import { parseCompanyImport } from './parser/company-import.parser'
import { ICompanyImportService } from './company-import.service.interface'

const LOGGING_CONTEXT = 'CompanyImportService'

/** A planned write plus its result row, produced by reconcile and consumed by apply. */
type CreatePlan = {
  row: ParsedCompanyRow
  postcodeId: string | null
  result: CompanyImportRowResultDto
}
type UpdatePlan = {
  company: CompanyModel
  updateFields: Partial<{
    name: string
    address: string | null
    postcodeId: string | null
    isatCategoryCode: string | null
    employeeCountCategory: CompanySizeEnum
    status: CompanyStatusEnum
  }>
  statusChange: { from: CompanyStatusEnum; to: CompanyStatusEnum } | null
  result: CompanyImportRowResultDto
}
type MarkPlan = { company: CompanyModel; result: CompanyImportRowResultDto }

type ReconcilePlan = {
  year: number | null
  creates: CreatePlan[]
  updates: UpdatePlan[]
  marked: MarkPlan[]
  unchanged: CompanyImportRowResultDto[]
  invalid: CompanyImportErrorDto[]
}

/** Compare two optional strings treating '' and null as equal. */
const norm = (v: string | null | undefined): string | null =>
  (v ?? '').trim() || null
const differs = (a: string | null | undefined, b: string | null | undefined) =>
  norm(a) !== norm(b)

@Injectable()
export class CompanyImportService implements ICompanyImportService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @InjectModel(IsatCategoryModel)
    private readonly isatCategoryModel: typeof IsatCategoryModel,
    @InjectModel(PostcodeModel)
    private readonly postcodeModel: typeof PostcodeModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
  ) {}

  async preview(fileBuffer: Buffer): Promise<CompanyImportResultDto> {
    const plan = await this.reconcile(fileBuffer)
    return this.toResult(plan, false)
  }

  async apply(
    fileBuffer: Buffer,
    actorUserId: string,
  ): Promise<CompanyImportResultDto> {
    const plan = await this.reconcile(fileBuffer)

    await this.sequelize.transaction(async () => {
      // CLS auto-propagates this transaction to the event service's writes too.
      for (const c of plan.creates) {
        const company = await this.companyModel.create({
          name: c.row.name,
          nationalId: c.row.nationalId,
          employeeCountCategory: c.row.size,
          address: c.row.address,
          postcodeId: c.postcodeId,
          isatCategoryCode: c.row.isatCategoryCode,
          status: CompanyStatusEnum.ACTIVE,
        })
        await this.companyEventService.emitCreated(
          company.id,
          company.status,
          actorUserId,
        )
      }

      for (const u of plan.updates) {
        await u.company.update(u.updateFields)
        if (u.statusChange) {
          await this.companyEventService.emitStatusChanged(
            u.company.id,
            u.statusChange.from,
            u.statusChange.to,
            actorUserId,
            'Company import',
          )
        }
      }

      for (const m of plan.marked) {
        const from = m.company.status
        await m.company.update({ status: CompanyStatusEnum.UNKNOWN })
        await this.companyEventService.emitStatusChanged(
          m.company.id,
          from,
          CompanyStatusEnum.UNKNOWN,
          actorUserId,
          'Absent from company import',
        )
      }
    })

    const result = this.toResult(plan, true)
    this.logger.info(
      `Company import applied by ${actorUserId} (year ${result.year ?? 'n/a'}): ` +
        `created=${result.created.length} updated=${result.updated.length} ` +
        `unchanged=${result.unchanged.length} reactivated=${result.reactivated.length} ` +
        `markedUnknown=${result.markedUnknown.length} invalid=${result.invalid.length}`,
      { context: LOGGING_CONTEXT },
    )

    return result
  }

  /** Pure planning: parse, validate ISAT, resolve postcodes, categorize. No writes. */
  private async reconcile(fileBuffer: Buffer): Promise<ReconcilePlan> {
    const parsed = await parseCompanyImport(fileBuffer)
    const errors: CompanyImportErrorDto[] = [...parsed.errors]

    // Validate ISAT codes against the reference table; reject unknowns.
    const isatCodes = [
      ...new Set(parsed.rows.map((r) => r.isatCategoryCode).filter(Boolean)),
    ] as string[]
    const knownIsat = new Set(
      isatCodes.length
        ? (
            await this.isatCategoryModel.findAll({
              where: { code: { [Op.in]: isatCodes } },
              attributes: ['code'],
            })
          ).map((m) => m.code)
        : [],
    )

    const validRows: ParsedCompanyRow[] = []
    for (const row of parsed.rows) {
      if (row.isatCategoryCode && !knownIsat.has(row.isatCategoryCode)) {
        errors.push({
          row: row.row,
          nationalId: row.nationalId,
          reason: `Unknown ÍSAT code "${row.isatCategoryCode}"`,
        })
        continue
      }
      validRows.push(row)
    }

    // Resolve postcodes (soft — an unresolved code is a note, not a rejection).
    const postcodeCodes = [
      ...new Set(validRows.map((r) => r.postcodeCode).filter(Boolean)),
    ] as string[]
    const postcodeIdByCode = new Map<string, string>()
    if (postcodeCodes.length) {
      const found = await this.postcodeModel.findAll({
        where: { code: { [Op.in]: postcodeCodes } },
      })
      for (const p of found) postcodeIdByCode.set(p.code, p.id)
    }

    // Load every company once, with its postcode (for diff display).
    const companies = await this.companyModel.findAll({
      include: [{ model: PostcodeModel, as: 'postcode' }],
    })
    const byNationalId = new Map(companies.map((c) => [c.nationalId, c]))

    // Every kennitala that appeared in the file (valid or invalid) — so a
    // company present-but-rejected is NOT also marked absent.
    const fileNationalIds = new Set<string>([
      ...validRows.map((r) => r.nationalId),
      ...errors.map((e) => e.nationalId).filter((n): n is string => !!n),
    ])

    const plan: ReconcilePlan = {
      year: parsed.year,
      creates: [],
      updates: [],
      marked: [],
      unchanged: [],
      invalid: errors,
    }

    for (const row of validRows) {
      const company = byNationalId.get(row.nationalId)
      const resolvedPostcodeId = row.postcodeCode
        ? (postcodeIdByCode.get(row.postcodeCode) ?? null)
        : null
      const postcodeUnresolved =
        !!row.postcodeCode && !postcodeIdByCode.has(row.postcodeCode)
      const note = postcodeUnresolved
        ? `Postnúmer "${row.postcodeCode}" not found — postcode left unchanged`
        : null

      if (!company) {
        plan.creates.push({
          row,
          postcodeId: resolvedPostcodeId,
          result: {
            nationalId: row.nationalId,
            name: row.name,
            outcome: CompanyImportOutcomeEnum.CREATED,
            changedFields: [],
            note,
          },
        })
        continue
      }

      const { changes, updateFields } = this.buildChanges(
        company,
        row,
        postcodeUnresolved ? undefined : resolvedPostcodeId,
      )

      const reactivating =
        company.status === CompanyStatusEnum.UNKNOWN ||
        company.status === CompanyStatusEnum.INACTIVE
      const statusChange = reactivating
        ? { from: company.status, to: CompanyStatusEnum.ACTIVE }
        : null

      if (statusChange) {
        updateFields.status = CompanyStatusEnum.ACTIVE
        changes.unshift({
          field: 'status',
          from: statusChange.from,
          to: statusChange.to,
        })
      }

      if (!changes.length) {
        plan.unchanged.push({
          nationalId: row.nationalId,
          name: row.name,
          outcome: CompanyImportOutcomeEnum.UNCHANGED,
          changedFields: [],
          note,
        })
        continue
      }

      plan.updates.push({
        company,
        updateFields,
        statusChange,
        result: {
          nationalId: row.nationalId,
          name: row.name,
          outcome: statusChange
            ? CompanyImportOutcomeEnum.REACTIVATED
            : CompanyImportOutcomeEnum.UPDATED,
          changedFields: changes,
          note,
        },
      })
    }

    // Companies we hold that are absent from the file.
    for (const company of companies) {
      if (fileNationalIds.has(company.nationalId)) continue
      // Leave deliberate deactivations and already-unknown rows untouched.
      if (company.status !== CompanyStatusEnum.ACTIVE) continue
      plan.marked.push({
        company,
        result: {
          nationalId: company.nationalId,
          name: company.name,
          outcome: CompanyImportOutcomeEnum.MARKED_UNKNOWN,
          changedFields: [
            {
              field: 'status',
              from: CompanyStatusEnum.ACTIVE,
              to: CompanyStatusEnum.UNKNOWN,
            },
          ],
          note: null,
        },
      })
    }

    return plan
  }

  /**
   * Diff the authoritative fields. A null/absent file value means "not
   * provided" and never clears an existing value (except size, which the file
   * always asserts). `resolvedPostcodeId` is undefined when the postcode could
   * not be resolved (skip the postcode diff entirely).
   */
  private buildChanges(
    company: CompanyModel,
    row: ParsedCompanyRow,
    resolvedPostcodeId: string | null | undefined,
  ): {
    changes: CompanyImportFieldChangeDto[]
    updateFields: UpdatePlan['updateFields']
  } {
    const changes: CompanyImportFieldChangeDto[] = []
    const updateFields: UpdatePlan['updateFields'] = {}

    if (differs(row.name, company.name)) {
      changes.push({ field: 'name', from: company.name, to: row.name })
      updateFields.name = row.name
    }

    if (row.address != null && differs(row.address, company.address)) {
      changes.push({ field: 'address', from: company.address, to: row.address })
      updateFields.address = row.address
    }

    if (
      resolvedPostcodeId !== undefined &&
      resolvedPostcodeId !== company.postcodeId
    ) {
      changes.push({
        field: 'postcode',
        from: company.postcode?.code ?? null,
        to: row.postcodeCode,
      })
      updateFields.postcodeId = resolvedPostcodeId
    }

    if (
      row.isatCategoryCode != null &&
      differs(row.isatCategoryCode, company.isatCategoryCode)
    ) {
      changes.push({
        field: 'isat',
        from: company.isatCategoryCode,
        to: row.isatCategoryCode,
      })
      updateFields.isatCategoryCode = row.isatCategoryCode
    }

    if (row.size !== company.employeeCountCategory) {
      changes.push({
        field: 'size',
        from: company.employeeCountCategory,
        to: row.size,
      })
      updateFields.employeeCountCategory = row.size
    }

    return { changes, updateFields }
  }

  private toResult(
    plan: ReconcilePlan,
    committed: boolean,
  ): CompanyImportResultDto {
    const updated = plan.updates
      .filter((u) => u.result.outcome === CompanyImportOutcomeEnum.UPDATED)
      .map((u) => u.result)
    const reactivated = plan.updates
      .filter((u) => u.result.outcome === CompanyImportOutcomeEnum.REACTIVATED)
      .map((u) => u.result)
    const created = plan.creates.map((c) => c.result)
    const markedUnknown = plan.marked.map((m) => m.result)

    const noticeCount = [
      ...created,
      ...updated,
      ...reactivated,
      ...plan.unchanged,
    ].filter((r) => r.note).length

    return {
      committed,
      year: plan.year,
      noticeCount,
      created,
      updated,
      unchanged: plan.unchanged,
      markedUnknown,
      reactivated,
      invalid: plan.invalid,
    }
  }
}
