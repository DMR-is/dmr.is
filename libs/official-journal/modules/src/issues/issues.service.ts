import { isNotEmpty } from 'class-validator'
import { Op, WhereOptions } from 'sequelize'

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'
import { AdvisoryLockService, AWSService } from '@dmr.is/shared/modules'
import {
  generatePaging,
  getLimitAndOffset,
} from '@dmr.is/utils/server/serverUtils'

import { advertMigrate } from '../journal/migrations'
import { AdvertModel } from '../journal/models'
import { PdfService } from '../pdf/pdf.service'
import { DEPARTMENT_IDS, LOGGING_CONTEXT, TASK_NAMESPACE } from './constants'
import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IssuesModel } from './issues.model'
import { IIssuesService } from './issues.service.interface'
import {
  getCurrentMonthDateRange,
  getMonthName,
  mapDepartmentIdToTitle,
} from './utils'

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
  async getIssues(
    query: GetMonthlyIssuesQueryDto,
  ): Promise<GetMonthlyIssuesResponseDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const whereClause: WhereOptions<IssuesModel> = {}

    if (query.departmentId) {
      whereClause.departmentId = query.departmentId
    }

    if (query.fromDate && query.toDate) {
      whereClause.startDate = {
        [Op.gte]: query.fromDate,
      }
      whereClause.endDate = {
        [Op.lte]: query.toDate,
      }
    } else if (query.fromDate) {
      whereClause.startDate = {
        [Op.gte]: query.fromDate,
      }
    } else if (query.toDate) {
      whereClause.endDate = {
        [Op.lte]: query.toDate,
      }
    }

    const issues = await this.issuesModel.findAndCountAll({
      limit,
      offset,
      where: {
        departmentId: query.departmentId,
      },
      order: [['createdAt', 'DESC']],
    })

    const mapped = issues.rows.map((issue) => issue.fromModel())
    const paging = generatePaging(
      issues.rows,
      query.page,
      query.pageSize,
      issues.count,
    )

    return {
      issues: mapped,
      paging: paging,
    }
  }

  async generateMonthlyIssues(departmentId: string, date: Date): Promise<void> {
    const now = new Date()

    if (!process.env.ADVERTS_BUCKET) {
      this.logger.error('ADVERTS_BUCKET environment variable is not set', {
        context: LOGGING_CONTEXT,
        category: 'issues-service',
        timestamp: now.toISOString(),
      })
      throw new InternalServerErrorException()
    }

    if (!DEPARTMENT_IDS.includes(departmentId)) {
      this.logger.warn(
        `Attempted to generate issues for invalid department ID: ${departmentId}`,
        {
          context: LOGGING_CONTEXT,
          category: 'issues-service',
          departmentId,
          timestamp: now.toISOString(),
        },
      )
      throw new BadRequestException(`Invalid department ID: ${departmentId}`)
    }

    this.logger.info('Starting monthly issues generation', {
      context: LOGGING_CONTEXT,
      category: 'generateMonthlyIssues',
      timestamp: now.toISOString(),
    })

    // We need to fetch all the cases from last month and generate the issues for them
    const [startDate, endDate] = getCurrentMonthDateRange(date)

    this.logger.info(
      `Fetching cases between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      {
        context: LOGGING_CONTEXT,
        category: 'generateMonthlyIssues',
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString(),
        timestamp: now.toISOString(),
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
            category: 'generateMonthlyIssues',
            departmentId,
            fromDate: startDate.toISOString(),
            toDate: endDate.toISOString(),
            timestamp: now.toISOString(),
          },
        )
        return
      }

      this.logger.info(
        `Fetched ${advertsResults.count} cases for department ${departmentId}`,
        {
          context: LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId: departmentId,
          caseCount: advertsResults.count,
          timestamp: now.toISOString(),
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
      const key = `issues/${currentYear}/${month}/${departmentName}/issue.pdf`
      const fileName = `Stjórnartíðindi ${departmentName} - ${month} ${currentYear}.pdf`
      const pdfBuffer = await this.pdfService.generateIssuePdf(htmlContent)

      this.logger.info(
        `Generated PDF for department ${departmentId}, uploading to S3 with key ${key}`,
        {
          context: LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId: departmentId,
          s3Key: key,
        },
      )

      const uploadResults = await this.awsService.uploadObject(
        process.env.ADVERTS_BUCKET,
        key,
        fileName,
        pdfBuffer,
      )

      if (!uploadResults.result.ok) {
        this.logger.error(
          `Failed to upload issue PDF to S3 for department ${departmentId}`,
          {
            context: LOGGING_CONTEXT,
            category: 'generateMonthlyIssues',
            departmentId,
            s3Key: key,
            error: uploadResults.result.error,
          },
        )
        throw new Error('Failed to upload issue PDF to S3')
      }

      const [issue] = await this.issuesModel.upsert({
        departmentId: departmentId,
        startDate: startDate,
        endDate: endDate,
        url: uploadResults.result.value,
      })


      this.logger.info(
        `Successfully generated and uploaded issue for department ${departmentId}`,
        {
          context: LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId,
          issueId: issue.id,
          s3Key: key,
        },
      )
    } catch (error) {
      this.logger.error('Error generating monthly issues', {
        context: LOGGING_CONTEXT,
        category: 'generateMonthlyIssues',
        error: error,
      })

      throw error
    }
  }

  @Cron(
    '0 0 1 * *', // Every month on the 1st at midnight
    {
      name: 'monthly-issues-task',
      timeZone: 'Atlantic/Reykjavik',
    },
  )
  private async monthlyIssuesTask() {
    for (const [index, departmentId] of DEPARTMENT_IDS.entries()) {
      const { ran, reason } =
        await this.advisoryLockService.runWithDistributedLock(
          TASK_NAMESPACE, // Namespace for issues generation
          index + 1, // Unique lock key per department (1, 2, 3)
          async () => {
            const now = new Date()

            this.logger.info(
              `Running monthly issues generation for department ${departmentId}`,
              {
                context: LOGGING_CONTEXT,
                category: 'monthly-issues-task',
                departmentId,
                timestamp: now.toISOString(),
              },
            )

            // this task runs first of every month so this should always be last month's date
            const yesterday = new Date(now.getFullYear(), now.getMonth() - 1, 1)

            await this.generateMonthlyIssues(departmentId, yesterday)

            const endTime = new Date()
            const duration = (endTime.getTime() - now.getTime()) / 1000

            this.logger.info(
              `Finished monthly issues generation for department ${departmentId} in ${duration.toFixed(2)} seconds`,
              {
                context: LOGGING_CONTEXT,
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
            context: LOGGING_CONTEXT,
            category: 'issues-service',
            departmentId,
            timestamp: new Date().toISOString(),
          },
        )
      }
    }
  }
}
