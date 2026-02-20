import { isNotEmpty } from 'class-validator'

import { Inject, Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'
import { AdvisoryLockService, AWSService } from '@dmr.is/shared/modules'

import { advertMigrate } from '../journal/migrations'
import { AdvertModel } from '../journal/models'
import { PdfService } from '../pdf/pdf.service'
import { DEPARTMENT_IDS, ISSUES_BUCKET, LOGGING_CONTEXT, TASK_NAMESPACE } from './constants'
import { IssuesModel } from './issues.model'
import { IIssuesService } from './issues.service.interface'
import { getDateRange, getMonthName, mapDepartmentIdToTitle } from './utils'

@Injectable()
export class IssusesService implements IIssuesService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(AWSService) private readonly awsService: AWSService,
    @Inject(PdfService) private readonly pdfService: PdfService,
    @Inject(AdvisoryLockService)
    private readonly advisoryLockService: AdvisoryLockService,
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
    @InjectModel(IssuesModel) private readonly issuesModel: typeof IssuesModel,
  ) {}

  @Cron(
    '0 0 1 * *', // Every month on the 1st at midnight
    {
      name: 'monthly-issues-generation',
      timeZone: 'Atlantic/Reykjavik',
    },
  )
  private async run() {
    for (const [index, departmentId] of DEPARTMENT_IDS.entries()) {
      const { ran, reason } =
        await this.advisoryLockService.runWithDistributedLock(
          TASK_NAMESPACE, // Namespace for issues generation
          index + 1, // Unique lock key per department (1, 2, 3)
          async () => {
            await this.generateMonthlyIssues(departmentId)
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
            context: LOGGING_CONTEXT,
            category: 'issues-service',
            departmentId,
            timestamp: new Date().toISOString(),
          },
        )
      }
    }
  }

  async generateMonthlyIssues(departmentId: string): Promise<void> {
    const now = new Date()

    this.logger.info('Starting monthly issues generation', {
      context: LOGGING_CONTEXT,
      category: 'issues-task',
      timestamp: now.toISOString(),
    })

    // We need to fetch all the cases from last month and generate the issues for them
    const [startDate, endDate] = getDateRange(now)

    this.logger.info(
      `Fetching cases between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      {
        context: LOGGING_CONTEXT,
        category: 'issues-task',
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString(),
      },
    )

    try {
      const advertsResults = await this.advertModel
        .scope('detailed')
        .findAndCountAll({
          where: {
            departmentId: departmentId,
          },
        })

      if (advertsResults.count === 0) {
        this.logger.info(
          `No cases found for department ${departmentId} in the given date range, skipping issue generation.`,
          {
            context: LOGGING_CONTEXT,
            category: 'issues-task',
            departmentId,
            fromDate: startDate.toISOString(),
            toDate: endDate.toISOString(),
          },
        )
        return
      }

      this.logger.info(
        `Fetched ${advertsResults.count} cases for department ${departmentId}`,
        {
          context: LOGGING_CONTEXT,
          category: 'issues-task',
          departmentId,
          caseCount: advertsResults.count,
        },
      )

      const htmlContent = advertsResults.rows
        .map(advertMigrate)
        .map((ad) => ad.document.html ?? '')
        .filter(isNotEmpty)
        .join('<div class="advert-divider-line"></div>')

      const currentYear = now.getFullYear()
      const month = getMonthName(now)
      const departmentName = mapDepartmentIdToTitle(departmentId)
      const key = `adverts/issues/${currentYear}/${month}/${departmentName}/issue.pdf`
      const fileName = `Stjórnartíðindi ${departmentName} - ${month} ${currentYear}.pdf`
      const pdfBuffer = await this.pdfService.generateIssuePdf(htmlContent)

      this.logger.info(`Generated PDF for department ${departmentId}, uploading to S3 with key ${key}`, {
        context: LOGGING_CONTEXT,
        category: 'issues-task',
        departmentId,
        s3Key: key,
      })

      const uploadResults = await this.awsService.uploadObject(
        ISSUES_BUCKET,
        key,
        fileName,
        pdfBuffer,
      )

      if (!uploadResults.result.ok) {
        this.logger.error(`Failed to upload issue PDF to S3 for department ${departmentId}`, {
          context: LOGGING_CONTEXT,
          category: 'issues-task',
          departmentId,
          s3Key: key,
          error: uploadResults.result.error,
        })
        throw new Error('Failed to upload issue PDF to S3')
      }

      const issue = await this.issuesModel.create({
        departmentId: departmentId,
        startDate: startDate,
        endDate: endDate,
        url: uploadResults.result.value,
      })

      this.logger.info(`Successfully generated and uploaded issue for department ${departmentId}`, {
        context: LOGGING_CONTEXT,
        category: 'issues-task',
        departmentId,
        issueId: issue.id,
        s3Key: key,
      })

    } catch (error) {
      this.logger.error('Error generating monthly issues', {
        context: LOGGING_CONTEXT,
        category: 'issues-task',
        error: error,
      })

      throw error
    }
  }
}
