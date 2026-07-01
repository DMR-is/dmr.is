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

    // Fetch the staged workbook and parse it in-memory, then drop the object.
    const buffer = await this.importUploadService.fetchWorkbook(
      key,
      ImportUploadBoundary.APPLICATION,
    )
    let parsed
    try {
      parsed = await this.reportExcelService.importWorkbook(buffer)
    } finally {
      await this.importUploadService.cleanup(key)
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

    this.logger.info(
      `Seeded draft report "${report.id}" from workbook (${parsed.employees.length} employees)`,
      { context: LOGGING_CONTEXT, reportId: report.id },
    )

    return this.reportDraftService.getDraftDetail(providerId, company)
  }
}
