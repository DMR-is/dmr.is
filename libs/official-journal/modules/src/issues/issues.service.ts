import { isNotEmpty } from 'class-validator'
import { Op, WhereOptions } from 'sequelize'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'
import { AdvisoryLockService, IAWSService } from '@dmr.is/shared/modules'
import { cleanLegacyHtml } from '@dmr.is/utils/server/cleanLegacyHtml'
import {
  formatAnyDate,
  generatePaging,
  getLimitAndOffset,
  getS3Bucket,
  handlePdfAdditions,
} from '@dmr.is/utils/server/serverUtils'

import { caseAdditionMigrate } from '../case/migrations/case-addition.migrate'
import { AdvertModel } from '../journal/models'
import { IPdfService } from '../pdf/pdf.service.interface'
import { advertPdfTemplate } from '../pdf/pdf-advert-template'
import {
  ISSUES_ALLOWED_DEPARTMENT_IDS,
  ISSUES_LOGGING_CONTEXT,
  ISSUES_TASK_NAMESPACE,
} from './constants'
import {
  GetMonthlyIssuesQueryDto,
  GetMonthlyIssuesResponseDto,
} from './issues.dto'
import { IssuesModel } from './issues.model'
import { IIssuesService } from './issues.service.interface'
import {
  getCurrentMonthDateRange,
  mapDepartmentIdToLetter,
  mapDepartmentIdToTitle,
} from './utils'

@Injectable()
export class IssusesService implements IIssuesService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly awsService: IAWSService,
    @Inject(IPdfService) private readonly pdfService: IPdfService,
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
      where: whereClause,
      order: [['startDate', 'DESC']],
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

    if (!ISSUES_ALLOWED_DEPARTMENT_IDS.includes(departmentId)) {
      this.logger.warn(
        `Attempted to generate issues for invalid department ID: ${departmentId}`,
        {
          context: ISSUES_LOGGING_CONTEXT,
          category: 'issues-service',
          departmentId,
          timestamp: now.toISOString(),
        },
      )
      throw new BadRequestException(`Invalid department ID: ${departmentId}`)
    }

    this.logger.info('Starting monthly issues generation', {
      context: ISSUES_LOGGING_CONTEXT,
      category: 'generateMonthlyIssues',
      timestamp: now.toISOString(),
    })

    // We need to fetch all the cases from last month and generate the issues for them
    const [startDate, endDate] = getCurrentMonthDateRange(date)

    this.logger.info(
      `Fetching cases between ${startDate.toISOString()} and ${endDate.toISOString()}`,
      {
        context: ISSUES_LOGGING_CONTEXT,
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
          distinct: true,
          col: 'AdvertModel.id',
          where: {
            departmentId: departmentId,
            publicationDate: {
              [Op.between]: [startDate, endDate],
            },
          },
          order: [['serialNumber', 'ASC']],
        })

      if (advertsResults.count === 0) {
        this.logger.info(
          `No cases found for department ${departmentId} in the given date range, skipping issue generation.`,
          {
            context: ISSUES_LOGGING_CONTEXT,
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
          context: ISSUES_LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId: departmentId,
          caseCount: advertsResults.count,
          timestamp: now.toISOString(),
        },
      )

      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const departmentLetter = mapDepartmentIdToLetter(departmentId)
      const departmentTitle = mapDepartmentIdToTitle(departmentId)

      const firstSerialNumber = advertsResults.rows[0].serialNumber
      const lastSerialNumber =
        advertsResults.rows[advertsResults.rows.length - 1].serialNumber

      const frontpage = `
        <div class="issues-frontpage">
          <h1>Stjórnartíðindi</h1>
          <h4>${departmentLetter} - ${month}</h4>
          <h6>Nr. ${firstSerialNumber} - ${lastSerialNumber}</h6>
          <h2>${year}</h2>
        </div>
      `

      const tableOfContents = `
        <div class="issues-table-of-contents">
            <table class="issues-table-of-contents-header">
              <thead>
                <tr>
                  <th align="left">STJÓRNARTÍÐINDI<br />ISSN 1670-6528</th>
                  <th class="issues-table-of-contents-heading">Efnisyfirlit ${departmentLetter} ${month} ${year}</th>
                  <th align="right">${departmentTitle.toUpperCase().replace(' ', '-')}<br />ISSN 1670-6560</th>
                </tr>
              </thead>
              <tbody>
            </table>

            <table class="issues-table-of-contents-table">
              <thead style="display: table-header-group;">
                <tr>
                  <td class="with-border" align="center">Númer</td>
                  <td class="with-border" align="center">Fyrirsögn</td>
                </tr>
                <tr>
                  <td class="fake-space" colspan="2"> </td>
                </tr>
              </thead>



              <tbody>
                ${advertsResults.rows
                  .map((advert) => {
                    const raw =
                      `${advert.type.title} ${advert.subject}`.toLowerCase()
                    const title = raw.charAt(0).toUpperCase() + raw.slice(1)
                    return `
                      <tr>
                        <td align="center">${advert.serialNumber}</td>
                        <td>${title}</td>
                      </tr>
                    `
                  })
                  .join('')}
              </tbody>
            </table>
        </div>
      `

      const advertContents = advertsResults.rows
        .map((ad, index) => {
          const html = advertPdfTemplate({
            content: ad.isLegacy
              ? cleanLegacyHtml(ad.documentHtml)
              : ad.documentHtml,
            additions: handlePdfAdditions(
              ad.case?.additions?.map((addition) =>
                caseAdditionMigrate(addition),
              ) || [],
            ),
            correction:
              ad.corrections
                ?.map((correction) => correction.documentHtml)
                .join('') ?? undefined,
            hiddenSignature: ad.hideSignatureDate,
            title: `${ad.type.title} ${ad.subject}`,
            type: ad.type.title,
          })

          return {
            html,
            issueTopMeta:
              index === 0
                ? `${departmentLetter} ${month} – ${year}`
                : undefined,
            publicationDate: ad.publicationDate,
            serial: ad.serialNumber,
          }
        })
        .filter((advert) => isNotEmpty(advert.html))

      const title = `${departmentLetter}_hefti_${month}_${year}`
      const key = `assets/issues/${year}/${month}/${departmentLetter}/${title}.pdf`
      const pdfBuffer = await this.pdfService.generateIssuePdf(
        frontpage,
        tableOfContents,
        advertContents,
      )

      this.logger.info(
        `Generated PDF for department ${departmentId}, uploading to S3 with key ${key}`,
        {
          context: ISSUES_LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId: departmentId,
          s3Key: key,
        },
      )

      const uploadResults = await this.awsService.uploadObject(
        getS3Bucket(),
        key,
        key,
        pdfBuffer,
      )

      if (!uploadResults.result.ok) {
        this.logger.error(
          `Failed to upload issue PDF to S3 for department ${departmentId}`,
          {
            context: ISSUES_LOGGING_CONTEXT,
            category: 'generateMonthlyIssues',
            departmentId,
            s3Key: key,
            error: uploadResults.result.error,
          },
        )
        throw new Error('Failed to upload issue PDF to S3')
      }

      const [issue] = await this.issuesModel.upsert({
        title: title,
        departmentId: departmentId,
        startDate: startDate,
        endDate: endDate,
        url: uploadResults.result.value,
      })

      this.logger.info(
        `Successfully generated and uploaded issue for department ${departmentId}`,
        {
          context: ISSUES_LOGGING_CONTEXT,
          category: 'generateMonthlyIssues',
          departmentId,
          issueId: issue.id,
          s3Key: key,
        },
      )
    } catch (error) {
      this.logger.error('Error generating monthly issues', {
        context: ISSUES_LOGGING_CONTEXT,
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

            await this.generateMonthlyIssues(departmentId, yesterday)

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
            category: 'issues-service',
            departmentId,
            timestamp: new Date().toISOString(),
          },
        )
      }
    }
  }
}
