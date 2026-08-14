import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { allocateReportIdentifier } from '../report/lib/report-identifier'
import { ReportModel } from '../report/models/report.model'
import { IReportIdentifierService } from './report-identifier.service.interface'

const LOGGING_CONTEXT = 'ReportIdentifierService'

/**
 * Turns the pure identifier policy in `report/lib/report-identifier.ts` into a
 * code no report is using yet, by probing the report table for each candidate.
 *
 * A service rather than a helper because both creation paths need it and they
 * reach the report table through different services: `ReportCreateService`
 * inserts a row, `ReportDraftSubmitService` updates a DRAFT in place. Each used
 * to carry its own copy of the probe and the collision log — identical apart
 * from the logging context, and only one of the two was covered by a test.
 * Minting a report identity has nothing to do with drafts, so it does not
 * belong on `IReportDraftService` either.
 *
 * The probe closes the birthday-bound risk (~17k reports for a 50% chance of
 * some pair colliding across six letters) cheaply and without an error path. It
 * cannot see an insert a concurrent request has not committed yet — under the
 * request's CLS transaction it cannot see it at all — so the partial unique
 * index `report_identifier_unique_idx` is what actually guarantees no two reports
 * share a code. That case rejects the write loudly instead of leaving an
 * ambiguous identifier search behind.
 */
@Injectable()
export class ReportIdentifierService implements IReportIdentifierService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ReportModel) private readonly reportModel: typeof ReportModel,
  ) {}

  allocate(): Promise<string> {
    return allocateReportIdentifier(
      async (candidate) =>
        (await this.reportModel.count({ where: { identifier: candidate } })) >
        0,
      (_candidate, attempt) =>
        this.logger.warn('Report identifier collision — retrying', {
          context: LOGGING_CONTEXT,
          attempt,
        }),
    )
  }
}
