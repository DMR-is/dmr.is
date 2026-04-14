import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import {
  BackfillHtmlItemDto,
  BackfillHtmlResponseDto,
} from './dto/html-admin.dto'
import { IHtmlAdminService } from './html-admin.service.interface'

const LOGGING_CONTEXT = 'HtmlAdminService'
const BATCH_SIZE = 50
const PREVIEW_LIMIT = 20

const MISSING_HTML_WHERE: WhereOptions = {
  publishedAt: { [Op.ne]: null },
  publishedHtml: null,
}

@Injectable()
export class HtmlAdminService implements IHtmlAdminService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
  ) {}

  private toItemDto(
    publication: AdvertPublicationModel,
    success: boolean,
    error?: string,
  ): BackfillHtmlItemDto {
    return {
      publicationId: publication.id,
      advertId: publication.advertId,
      title: publication.advert.title,
      type: publication.advert.type?.title ?? '',
      version: publication.versionLetter,
      success,
      error,
    }
  }

  async previewBackfill(user: DMRUser): Promise<BackfillHtmlResponseDto> {
    this.logger.info('Starting backfill preview', {
      context: LOGGING_CONTEXT,
      adminUserId: user.adminUserId,
    })

    const total = await this.publicationModel.count({
      where: MISSING_HTML_WHERE,
    })

    this.logger.info(`Found ${total} publications missing HTML`, {
      context: LOGGING_CONTEXT,
    })

    const preview = await this.publicationModel.findAll({
      where: MISSING_HTML_WHERE,
      limit: PREVIEW_LIMIT,
      include: [
        {
          model: AdvertModel.scope('detailed'),
          as: 'advert',
        },
      ],
    })

    const items: BackfillHtmlItemDto[] = []

    for (const publication of preview) {
      try {
        publication.advert.htmlMarkup(publication.versionLetter)
        items.push(this.toItemDto(publication, true))
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        items.push(this.toItemDto(publication, false, errorMessage))
      }
    }

    return {
      dryRun: true,
      total,
      backfilled: total,
      failed: 0,
      items,
      message: `Prufukeyrsla: ${total} auglýsingar fundust`,
    }
  }

  async runBackfill(user: DMRUser): Promise<BackfillHtmlResponseDto> {
    this.logger.info('Starting backfill execution', {
      context: LOGGING_CONTEXT,
      adminUserId: user.adminUserId,
    })

    const total = await this.publicationModel.count({
      where: MISSING_HTML_WHERE,
    })

    this.logger.info(`Backfill starting for ${total} publications`, {
      context: LOGGING_CONTEXT,
      total,
    })

    let backfilled = 0
    let failed = 0
    const totalBatches = Math.ceil(total / BATCH_SIZE)

    for (
      let batchNumber = 0;
      batchNumber < totalBatches;
      batchNumber++
    ) {
      const offset = batchNumber * BATCH_SIZE

      const batch = await this.publicationModel.findAll({
        where: MISSING_HTML_WHERE,
        limit: BATCH_SIZE,
        offset,
        include: [
          {
            model: AdvertModel.scope('detailed'),
            as: 'advert',
          },
        ],
      })

      if (batch.length === 0) {
        break
      }

      this.logger.info(
        `Processing batch ${batchNumber + 1}/${totalBatches} (${batch.length} publications)`,
        {
          context: LOGGING_CONTEXT,
          batchNumber: batchNumber + 1,
          totalBatches,
          batchSize: batch.length,
          offset,
          total,
        },
      )

      const results = await Promise.all(
        batch.map(async (publication) => {
          try {
            const html = publication.advert.htmlMarkup(
              publication.versionLetter,
            )
            await publication.update({ publishedHtml: html })
            return { success: true as const }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error'

            this.logger.error('Failed to backfill publication', {
              context: LOGGING_CONTEXT,
              batchNumber: batchNumber + 1,
              publicationId: publication.id,
              advertId: publication.advertId,
              error: errorMessage,
            })

            return { success: false as const }
          }
        }),
      )

      const batchBackfilled = results.filter((r) => r.success).length
      const batchFailed = results.filter((r) => !r.success).length
      backfilled += batchBackfilled
      failed += batchFailed

      this.logger.info(`Batch ${batchNumber + 1}/${totalBatches} complete`, {
        context: LOGGING_CONTEXT,
        batchNumber: batchNumber + 1,
        totalBatches,
        batchBackfilled,
        batchFailed,
        totalBackfilled: backfilled,
        totalFailed: failed,
      })
    }

    this.logger.info('Backfill execution complete', {
      context: LOGGING_CONTEXT,
      total,
      backfilled,
      failed,
      totalBatches,
      adminUserId: user.adminUserId,
    })

    return {
      dryRun: false,
      total,
      backfilled,
      failed,
      items: [],
      message: `Backfill lokið: ${backfilled} uppfærð, ${failed} mistókst`,
    }
  }
}
