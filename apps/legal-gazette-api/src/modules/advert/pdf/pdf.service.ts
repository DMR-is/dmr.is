import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/modules'
import { formatDate } from '@dmr.is/utils'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { CategoryModel } from '../../../models/category.model'
import { IssueModel } from '../../issues/issues.model'
import { getBrowser } from './lib/browser'
import {
  firstPageHeader,
  issueOverwriteCss,
  lastPageFooter,
  pageHeaders,
  pdfMetaTitle,
} from './lib/issue-templates'
import { mergePdfBuffers, PdfBufferInformation } from './lib/mergeBuffer'
import { pdfStyles } from './lib/pdf.css'

const YEAR_ESTABLISHED = 1907
const LOGGING_CONTEXT = 'PdfService'
const bucket =
  process.env.LEGAL_GAZETTE_BUCKET || 'legal-gazette-files-bucket-dev'
const cdnUrl =
  process.env.LEGAL_GAZETTE_CDN_URL ||
  'https://files.legal-gazette.dev.dmr-dev.cloud'

const CUTOFF_YEAR = 2025

@Injectable()
export class PdfService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly s3: IAWSService,
    @InjectModel(AdvertPublicationModel)
    readonly advertPublicationModel: typeof AdvertPublicationModel,
    @InjectModel(IssueModel) private readonly issueModel: typeof IssueModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browers = await getBrowser()
    try {
      const page = await browers.newPage()

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      })

      await page.addStyleTag({ content: pdfStyles })

      const pdfBuffer = await page.pdf({
        format: 'A4',
      })

      await browers.close()
      return pdfBuffer
    } catch (error) {
      this.logger.warn('Failed to generate PDF', {
        context: LOGGING_CONTEXT,
        error: error,
      })

      throw error
    } finally {
      await browers.close()
    }
  }

  private async uploadPdfToS3(
    key: string,
    fileName: string,
    pdfBuffer: Buffer,
  ) {
    const upload = await this.s3.uploadObject(bucket, key, fileName, pdfBuffer)

    if (!upload.result.ok) {
      this.logger.warn('Failed to upload pdf to s3', {
        error: upload.result.error,
        context: LOGGING_CONTEXT,
        key: key,
        upload: upload,
      })
      throw new Error('Failed to upload pdf to s3')
    } else {
      this.logger.debug('PDF generated and saved to S3', {
        context: LOGGING_CONTEXT,
        key: key,
        upload: upload,
      })
    }

    const url = `${cdnUrl}/${key}`
    return { s3Url: url }
  }
  async generatePdfAndSaveToS3(
    html: string,
    advertId: string,
    publicationId: string,
    title?: string,
  ): Promise<{ s3Url: string; key: string; pdfBuffer: Buffer }> {
    const pdfBuffer = await this.generatePdfFromHtml(
      `${title ? `<head><title>${title}</title></head>` : ''}${html}`,
    )

    const fileName = 'advert.pdf'
    const key = `adverts/${advertId}/${publicationId}/${fileName}`
    const uploadRes = await this.uploadPdfToS3(key, fileName, pdfBuffer)

    const publication = await this.advertPublicationModel.findOneOrThrow({
      where: { id: publicationId, advertId },
    })

    const url = uploadRes.s3Url

    await publication.update({
      pdfUrl: url,
    })

    return {
      s3Url: url,
      key: key,
      pdfBuffer,
    }
  }

  async getPdfFromS3(s3Url: string): Promise<Buffer> {
    const url = new URL(s3Url)
    const key = url.pathname.slice(1)

    const download = await this.s3.getObjectBuffer(key, bucket)

    if (!download.result.ok) {
      this.logger.warn('Failed to download pdf from s3', {
        error: download.result.error,
        context: LOGGING_CONTEXT,
        key: key,
        s3Url,
      })
      throw new Error('Failed to download pdf from s3')
    } else {
      this.logger.debug('Fetching PDF from S3', {
        context: LOGGING_CONTEXT,
        s3Url,
      })
    }

    return download.result.value
  }

  async handleAdvertPdf(
    advertId: string,
    publicationId: string,
    html: string,
    pdfUrl?: string,
    title?: string,
  ): Promise<Buffer> {
    if (pdfUrl) {
      return this.getPdfFromS3(pdfUrl)
    }
    const generatedPdf = await this.generatePdfAndSaveToS3(
      html,
      advertId,
      publicationId,
      title,
    )

    this.logger.debug('Fetching advert PDF', {
      context: LOGGING_CONTEXT,
      advertId: advertId,
    })

    return generatedPdf.pdfBuffer
  }

  async generatePdfIssueFromHtml(
    htmlContent: string,
    constants: {
      issueNr: number
      issueYear: number
      yearsIssued: number
      pageNumberDisplayStart: number
      fullDate: string
      syslumadur: string
    },
  ): Promise<PdfBufferInformation> {
    const browers = await getBrowser()
    try {
      const page = await browers.newPage()
      const issueFormatted = `${constants.issueNr}/${constants.issueYear}`
      const html =
        firstPageHeader(
          constants.issueNr,
          constants.yearsIssued,
          constants.fullDate,
        ) +
        htmlContent +
        lastPageFooter(
          constants.syslumadur,
          constants.issueNr,
          constants.issueYear,
        )

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      })

      await page.addStyleTag({ content: pdfStyles })
      await page.addStyleTag({
        content: issueOverwriteCss,
      })

      const firstPageBuffer = await page.pdf({
        format: 'A4',
        pageRanges: '1',
      })

      const restBuffer = await page.pdf({
        format: 'A4',
        pageRanges: '2-',
        footerTemplate: '<div></div>',
        headerTemplate: pageHeaders(issueFormatted),
        displayHeaderFooter: true,
      })

      const issueBufferInfo = await mergePdfBuffers(
        [firstPageBuffer, restBuffer],
        constants.pageNumberDisplayStart,
      )

      await browers.close()
      return issueBufferInfo
    } catch (error) {
      this.logger.warn('Failed to generate PDF', {
        context: LOGGING_CONTEXT,
        error: error,
      })

      throw error
    } finally {
      await browers.close()
    }
  }

  // Runs every day at 07:00 Iceland time. Issue PDF publication.
  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'daily-pdf-generation',
    timeZone: 'Atlantic/Reykjavik',
  })
  async dailyPdfGeneration() {
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

      const pdfGenInfo = await this.generatePdfIssueFromHtml(
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
      const uploadRes = await this.uploadPdfToS3(
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
