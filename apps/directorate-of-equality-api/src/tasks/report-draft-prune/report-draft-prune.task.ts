import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import { IReportDraftService } from '../../modules/report-draft/draft/report-draft.service.interface'
import {
  DOE_TASK_JOB_IDS,
  DOE_TASK_NAMESPACE,
  DRAFT_PRUNE_AGE_MONTHS,
  REPORT_DRAFT_PRUNE_LOGGING_CONTEXT,
} from '../constants'

const LOGGING_CONTEXT = REPORT_DRAFT_PRUNE_LOGGING_CONTEXT

// Daily in production; hourly in dev to make the task easy to observe.
const CRON_EXPRESSION =
  process.env.NODE_ENV === 'production'
    ? CronExpression.EVERY_DAY_AT_6AM
    : CronExpression.EVERY_HOUR

/**
 * Reaps abandoned draft reports (still `DRAFT`, untouched for
 * `DRAFT_PRUNE_AGE_MONTHS`). Runs on every API container; a Postgres advisory
 * lock ensures one container does the work per run.
 */
@Injectable()
export class ReportDraftPruneTask {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AdvisoryLockService)
    private readonly advisoryLockService: AdvisoryLockService,
    @Inject(IReportDraftService)
    private readonly reportDraftService: IReportDraftService,
  ) {}

  @Cron(CRON_EXPRESSION, {
    timeZone: 'Atlantic/Reykjavik',
    name: 'report-draft-prune-task',
  })
  async run(): Promise<void> {
    const { ran, reason } = await this.advisoryLockService.runWithDistributedLock(
      DOE_TASK_NAMESPACE,
      DOE_TASK_JOB_IDS.reportDraftPrune,
      async () => {
        await this.reportDraftService.pruneStaleDrafts(this.cutoff())
      },
      {
        cooldownMs: 12 * 60 * 60 * 1000,
        containerId: 'report-draft-prune',
      },
    )

    if (!ran) {
      this.logger.debug(`Skipped report draft prune task: ${reason}`, {
        context: LOGGING_CONTEXT,
      })
    }
  }

  /** Now minus the prune-age window. */
  private cutoff(): Date {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - DRAFT_PRUNE_AGE_MONTHS)
    return cutoff
  }
}
