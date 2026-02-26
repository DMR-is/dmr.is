import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { AdvisoryLockService } from '@dmr.is/shared-modules'

import {
  ISSUES_ALLOWED_DEPARTMENT_IDS,
  ISSUES_LOGGING_CONTEXT,
  ISSUES_TASK_NAMESPACE,
} from '../constants'
import { IIssuesService } from '../issues.service.interface'
import { IIssuesTaskService } from './issues.task.service.interface'

const CRON_EXPRESSION =
  process.env.NODE_ENV === 'production'
    ? CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON
    : CronExpression.EVERY_HOUR

@Injectable()
export class IssuesTaskService implements IIssuesTaskService   {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AdvisoryLockService)
    private readonly advisoryLockService: AdvisoryLockService,
    @Inject(IIssuesService) private readonly issuesService: IIssuesService,
  ) {}

  @Cron(CRON_EXPRESSION, {
    timeZone: 'Atlantic/Reykjavik',
    name: 'monthly-issues-task',
  })
  async generateMonthlyIssues(): Promise<void> {
    for (const [
      index,
      departmentId,
    ] of ISSUES_ALLOWED_DEPARTMENT_IDS.entries()) {
      const { ran, reason } =
        await this.advisoryLockService.runWithDistributedLock(
          ISSUES_TASK_NAMESPACE, // Namespace for issues generation
          index + 1, // Unique lock key per department (1, 2, 3)
          async () => {
            const now = new Date()

            this.logger.info(
              `Running monthly issues generation for department ${departmentId}`,
              {
                context: ISSUES_LOGGING_CONTEXT,
                category: 'monthly-issues-task',
                departmentId,
                timestamp: now.toISOString(),
              },
            )

            // this task runs first of every month so this should always be last month's date
            const yesterday = new Date(now.getFullYear(), now.getMonth() - 1, 1)

            await this.issuesService.generateMonthlyIssues(
              departmentId,
              yesterday,
            )

            const endTime = new Date()
            const duration = (endTime.getTime() - now.getTime()) / 1000

            this.logger.info(
              `Finished monthly issues generation for department ${departmentId} in ${duration.toFixed(2)} seconds`,
              {
                context: ISSUES_LOGGING_CONTEXT,
                category: 'monthly-issues-task',
                departmentId,
                startTime: now.toISOString(),
                endTime: endTime.toISOString(),
                duration: duration,
              },
            )
          },
          {
            cooldownMs: 60 * 60 * 1000, // 1 hour cooldown between runs
            containerId: `issues-generator-${departmentId}`,
          },
        )

      if (!ran) {
        this.logger.warn(
          `Skipped monthly issues generation for department ${departmentId}: ${reason}`,
          {
            context: ISSUES_LOGGING_CONTEXT,
            category: 'monthly-issues-task',
            departmentId,
            timestamp: new Date().toISOString(),
          },
        )
      }
    }
  }
}
