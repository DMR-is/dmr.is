import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../../import-upload/import-upload.service.interface'
import { assertParsedPayloadIntegrity } from '../../report/lib/employee-scores'
import { ReportTypeEnum } from '../../report/models/report.model'
import { IReportContentService } from '../../report-content/report-content.service.interface'
import { IReportExcelService } from '../../report-excel/report-excel.service.interface'
import { DraftDetailDto } from '../draft/dto/draft-detail.dto'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { IReportDraftSeedService } from './report-draft-seed.service.interface'

const LOGGING_CONTEXT = 'ReportDraftSeedService'

@Injectable()
export class ReportDraftSeedService implements IReportDraftSeedService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
    @Inject(IReportContentService)
    private readonly contentService: IReportContentService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  async seedFromWorkbook(
    providerId: string,
    company: CompanyDto,
    key: string,
  ): Promise<DraftDetailDto> {
    const report = await this.reportDraftService.findOwnedDraft(
      providerId,
      company,
    )

    if (report.type !== ReportTypeEnum.SALARY) {
      throw new BadRequestException(
        'Workbook import is only available for salary reports',
      )
    }

    // Parse the staged workbook, then drop the object. The download happens
    // inside `importWorkbook`, under the parse gate — this path shares that
    // gate with every other importer, so it must not hold the buffer while it
    // waits for a slot.
    let parsed
    try {
      parsed = await this.reportExcelService.importWorkbook(
        key,
        ImportUploadBoundary.APPLICATION,
      )
    } finally {
      await this.importUploadService.cleanup(
        key,
        ImportUploadBoundary.APPLICATION,
      )
    }

    // Reject a malformed workbook (duplicate titles/ordinals, bad step counts,
    // unresolved assignments, …) before touching the draft.
    assertParsedPayloadIntegrity(parsed)

    // Replace: clear the draft's current scoring content, then persist the
    // workbook. Scores stay NULL — derived on read, frozen at submit. Atomic
    // under the CLS request transaction.
    await this.reportDraftService.clearDraftChildren(report.id)
    const nullScores = parsed.employees.map(() => null)
    await this.contentService.persistParsedChildren(
      report.id,
      parsed,
      nullScores,
    )

    // The parser ran, so this draft's scoring content is workbook-derived
    // rather than keyed into the portal UI — which is the distinction
    // `report.imported_from_excel` exists to record, and this is the only place
    // in the application flow where the server can observe it. The same
    // statement bumps `updated_at`, which an import needs anyway: it writes
    // children only, exactly like bulk sync, so without touching the report row
    // the abandoned-draft reaper would count a draft the employer just
    // populated from a workbook as inactive.
    await this.reportDraftService.markImportedFromExcel(report.id)

    this.logger.info(
      `Seeded draft report "${report.id}" from workbook (${parsed.employees.length} employees)`,
      { context: LOGGING_CONTEXT, reportId: report.id },
    )

    return this.reportDraftService.getDraftDetail(providerId, company)
  }
}
