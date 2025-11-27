import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../../models/advert.model'
import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { CategoryModel } from '../../../../models/category.model'
import { IssueModel } from '../../../../models/issues.model'
import { pdfMetaTitle } from '../../pdf/lib/issue-templates'
import { PdfService } from '../../pdf/pdf.service'
import { IIssuesTask } from './issues.task.interface'

const LOGGING_CONTEXT = 'IssuesTask'
const YEAR_ESTABLISHED = 1907
const CUTOFF_YEAR = 2025

@Injectable()
export class IssuesTaskService implements IIssuesTask {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertPublicationModel)
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    @InjectModel(IssueModel) private readonly issueModel: typeof IssueModel,
    @Inject(PdfService) private readonly pdfService: PdfService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'daily-pdf-generation',
    timeZone: 'Atlantic/Reykjavik',
  })
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
        order: [['createdAt', 'DESC']],
      })

      if (!lastIssue || !lastIssue.publishDate) {
        this.logger.info(
          'No issue found, skipping PDF generation. Manually create an issue to start auto publishing.',
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
          include: [{ model: AdvertModel }],
          attributes: ['id', 'advertId', 'publishedAt', 'versionNumber'],
          order: [
            [
              { model: AdvertModel, as: 'advert' },
              { model: CategoryModel, as: 'category' },
              'title',
              'ASC',
            ],
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
            `<div class="advert-container">${pub.advert.htmlMarkup()}</div><div class="page-break"></div>`,
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

      // During cutoff year, continue with last issue number from previous system.
      const lastIssueNr =
        currentYear === CUTOFF_YEAR ? lastIssue.issue : issuesThisYear

      const nextIssueNumber = lastIssueNr + 1
      const publishDate = now

      const totalPagesThisYear =
        nextIssueNumber === 1 ? 0 : lastIssue.runningPageNumber

      const pdfGenInfo = await this.pdfService.generatePdfIssueFromHtml(
        `${pdfMetaTitle(title)}${combinedHtml}`,
        {
          issueNr: nextIssueNumber,
          issueYear: currentYear,
          yearsIssued: currentYear - YEAR_ESTABLISHED,
          fullDate: formatDate(now, 'd. MMMM yyyy'),
          syslumadur: 'Kristín Þórðardóttir',
          pageNumberDisplayStart: totalPagesThisYear + 2,
        },
      )

      const fileName = `issue-${nextIssueNumber}-${currentYear}.pdf`
      const key = `adverts/issues/${currentYear}/${fileName}`
      const uploadRes = await this.pdfService.uploadPdfToS3(
        key,
        fileName,
        pdfGenInfo.buffer,
      )

      const newIssue = await this.issueModel.create({
        publishDate: publishDate,
        title: title,
        issue: nextIssueNumber,
        year: now.getFullYear(),
        runningPageNumber: pdfGenInfo.totalPages + totalPagesThisYear,
        url: uploadRes.s3Url,
      })

      this.logger.info('Created new issue', {
        context: LOGGING_CONTEXT,
        issueId: newIssue.id,
        publicationCount: publications.length,
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
