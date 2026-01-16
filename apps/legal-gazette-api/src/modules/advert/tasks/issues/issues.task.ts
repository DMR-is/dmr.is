import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { formatDate, hashPdf } from '@dmr.is/utils'

import { TASK_JOB_IDS } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { CategoryModel } from '../../../../models/category.model'
import { IssueModel } from '../../../../models/issues.model'
import { IssueSettingsModel } from '../../../../models/issues-settings.model'
import { pdfMetaTitle } from '../../pdf/lib/issue-templates'
import { PdfService } from '../../pdf/pdf.service'
import { PgAdvisoryLockService } from '../lock.service'
import { IIssuesTask } from './issues.task.interface'

const LOGGING_CONTEXT = 'IssuesTask'
const YEAR_ESTABLISHED = 1907

const isProduction = process.env.API_ENV
  ? process.env.API_ENV === 'prod'
  : !process.env.IDENTITY_SERVER_DOMAIN?.includes('devland.is')

@Injectable()
export class IssuesTaskService implements IIssuesTask {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    @InjectModel(IssueModel) private readonly issueModel: typeof IssueModel,
    @InjectModel(IssueSettingsModel)
    private readonly issueSettingsModel: typeof IssueSettingsModel,
    @Inject(PdfService) private readonly pdfService: PdfService,
    private readonly lock: PgAdvisoryLockService,
  ) {}

  @Cron(
    isProduction ? CronExpression.EVERY_DAY_AT_7AM : '0 */20 * * * *', // Every 20 minutes in non-production
    {
      name: 'daily-pdf-generation',
      timeZone: 'Atlantic/Reykjavik',
    },
  )
  async run() {
    const { ran, reason } = await this.lock.runWithDistributedLock(
      TASK_JOB_IDS.issues,
      async () => {
        await this.dailyIssueGeneration()
      },
      {
        cooldownMs: 14 * 60 * 1000, // 14 minutes
        containerId: process.env.HOSTNAME,
      },
    )

    if (!ran) {
      this.logger.debug(`IssuesTask skipped (${reason})`, {
        context: LOGGING_CONTEXT,
      })
    }
  }

  async dailyIssueGeneration(): Promise<void> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

    try {
      this.logger.info('Starting daily PDF generation', {
        context: LOGGING_CONTEXT,
        fromDate: oneDayAgo.toISOString(),
        toDate: now.toISOString(),
      })

      const lastIssue = await this.issueModel.findOne({
        order: [['publishDate', 'DESC']],
      })

      if (
        !lastIssue ||
        !lastIssue.publishDate ||
        !lastIssue.runningPageNumber
      ) {
        this.logger.info(
          `
            No issue available, skipping PDF generation.
            Manually create an issue to start auto publishing.
            Manual issue should contain issueNr and publish information from previous systems most recent issue.
            ${lastIssue?.id ? `Last issue ID: ${lastIssue.id}` : 'No issues found in database.'}
            ${!lastIssue?.runningPageNumber ? 'Latest issue must have a running page number' : ''}
          `,
          {
            context: LOGGING_CONTEXT,
          },
        )
        return
      }

      const fromDate = lastIssue.publishDate

      this.logger.info('Fetching publications for new issue', {
        context: LOGGING_CONTEXT,
        fromDate: fromDate.toISOString(),
        toDate: now.toISOString(),
        lastIssueId: lastIssue?.id,
      })

      const publications = await this.advertPublicationModel
        .unscoped()
        .findAll({
          where: {
            publishedAt: {
              [Op.gt]: fromDate,
              [Op.lte]: now,
            },
          },
          include: [
            {
              model: AdvertModel.scope('detailed'),
              include: [{ model: CategoryModel, as: 'category' }],
            },
          ],
          attributes: ['id', 'advertId', 'publishedAt', 'versionNumber'],
          order: [
            [
              { model: AdvertModel, as: 'advert' },
              { model: CategoryModel, as: 'category' },
              'title',
              'ASC',
            ],
            ['publishedAt', 'ASC'],
          ],
        })
      if (publications.length === 0) {
        this.logger.info(
          'No new publications to process, skipping issue creation',
          {
            context: LOGGING_CONTEXT,
          },
        )
        return
      }

      this.logger.info(`Found ${publications.length} publications to process`, {
        context: LOGGING_CONTEXT,
        count: publications.length,
      })

      const combinedHtml = publications
        .map(
          (pub) =>
            `<div class="advert-container">${pub.advert.htmlMarkup()}</div><div class="advert-divider-line"></div>`,
        )
        .join('')

      const title = `Lögbirtingablaðið - Útgáfa ${formatDate(now, 'd. MMMM yyyy')}`

      const currentYear = now.getFullYear()

      const startOfYear = new Date(currentYear, 0, 1)
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)

      const issuesThisYear = await this.issueModel.count({
        where: {
          publishDate: {
            [Op.gte]: startOfYear,
            [Op.lte]: endOfYear,
          },
        },
      })

      const nextIssueNumber = issuesThisYear + 1
      const publishDate = now

      const totalPagesThisYear =
        nextIssueNumber === 1 ? 0 : lastIssue.runningPageNumber

      const issueSettings = await this.issueSettingsModel.findOne({
        order: [['createdAt', 'DESC']],
      })

      if (!issueSettings) {
        this.logger.error(
          'No issue settings found, district commisioner will be empty',
          {
            context: LOGGING_CONTEXT,
          },
        )
      }

      const districtCommissioner = issueSettings?.districtCommissioner ?? ''

      const pdfGenInfo = await this.pdfService.generatePdfIssueFromHtml(
        `${pdfMetaTitle(title)}${combinedHtml}`,
        {
          issueNr: nextIssueNumber,
          issueYear: currentYear,
          yearsIssued: currentYear - YEAR_ESTABLISHED,
          fullDate: formatDate(now, 'd. MMMM yyyy'),
          syslumadur: districtCommissioner,
          pageNumberDisplayStart: totalPagesThisYear + 2,
        },
      )

      const hash = hashPdf(pdfGenInfo.buffer)

      const fileName = `lbl-${nextIssueNumber}-${currentYear}.pdf`
      const key = `adverts/issues/${currentYear}/${fileName}`
      const uploadRes = await this.pdfService.uploadPdfToS3(
        key,
        fileName,
        pdfGenInfo.buffer,
        hash,
      )

      const newIssue = await this.issueModel.create({
        publishDate: publishDate,
        title: title,
        issue: nextIssueNumber,
        year: now.getFullYear(),
        runningPageNumber: pdfGenInfo.totalPages + totalPagesThisYear,
        url: uploadRes.s3Url,
        hash: hash,
      })

      this.logger.info('Created new issue', {
        context: LOGGING_CONTEXT,
        issueId: newIssue.id,
        publicationCount: publications.length,
        hash: hash,
      })
    } catch (error) {
      this.logger.error('daily PDF generation failed', {
        context: LOGGING_CONTEXT,
        error,
      })
      throw error
    }
  }
}
