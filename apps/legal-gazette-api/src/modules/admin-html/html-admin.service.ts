import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../models/advert.model'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { BackfilledPublicationModel } from '../../models/backfilled-publication.model'
import { TypeModel } from '../../models/type.model'
import {
  BackfilledPublicationItemDto,
  BackfilledPublicationsListDto,
  BackfilledPublicationsQueryDto,
  BackfillHtmlItemDto,
  BackfillHtmlResponseDto,
  BackfillJobStatusDto,
  BackfillStartResponseDto,
} from './dto/html-admin.dto'
import { IHtmlAdminService } from './html-admin.service.interface'

const LOGGING_CONTEXT = 'HtmlAdminService'
const BATCH_SIZE = 50
const REVERT_BATCH_SIZE = 100
const PREVIEW_LIMIT = 20

const MISSING_HTML_WHERE: WhereOptions = {
  publishedAt: { [Op.ne]: null },
  publishedHtml: null,
}

const defaultJobStatus = (): BackfillJobStatusDto => ({
  status: 'idle',
  total: 0,
  completed: 0,
  failed: 0,
  currentBatch: 0,
  totalBatches: 0,
})

@Injectable()
export class HtmlAdminService implements IHtmlAdminService {
  private backfillState: BackfillJobStatusDto = defaultJobStatus()
  private backfillLock = false

  private revertState: BackfillJobStatusDto = defaultJobStatus()
  private revertLock = false

  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
    @InjectModel(BackfilledPublicationModel)
    private readonly backfilledModel: typeof BackfilledPublicationModel,
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

  // ── Preview (dry run) ──

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

  // ── Backfill ──

  startBackfill(user: DMRUser): BackfillHtmlResponseDto {
    if (this.backfillLock) {
      return {
        dryRun: false,
        total: this.backfillState.total,
        backfilled: this.backfillState.completed,
        failed: this.backfillState.failed,
        items: [],
        message: 'Backfill is already running',
      }
    }

    this.backfillLock = true
    this.backfillState = {
      ...defaultJobStatus(),
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    this.logger.info('Backfill job started', {
      context: LOGGING_CONTEXT,
      adminUserId: user.adminUserId,
    })

    setImmediate(() => {
      void this.executeBackfill()
    })

    return {
      dryRun: false,
      total: 0,
      backfilled: 0,
      failed: 0,
      items: [],
      message: 'Backfill started',
    }
  }

  private async executeBackfill(): Promise<void> {
    try {
      const total = await this.publicationModel.count({
        where: MISSING_HTML_WHERE,
        transaction: null as any,
      })

      const totalBatches = Math.ceil(total / BATCH_SIZE)
      this.backfillState.total = total
      this.backfillState.totalBatches = totalBatches

      this.logger.info(
        `Backfill executing: ${total} publications, ${totalBatches} batches`,
        {
          context: LOGGING_CONTEXT,
          total,
          totalBatches,
        },
      )

      for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
        // Always offset 0: completed rows drop out of WHERE clause
        const batch = await this.publicationModel.findAll({
          where: MISSING_HTML_WHERE,
          limit: BATCH_SIZE,
          transaction: null as any,
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

        this.backfillState.currentBatch = batchNumber + 1

        this.logger.info(
          `Processing batch ${batchNumber + 1}/${totalBatches} (${batch.length} publications)`,
          {
            context: LOGGING_CONTEXT,
            batchNumber: batchNumber + 1,
            totalBatches,
            batchSize: batch.length,
            completed: this.backfillState.completed,
            total,
          },
        )

        const results = await Promise.all(
          batch.map(async (publication) => {
            try {
              const html = publication.advert.htmlMarkup(
                publication.versionLetter,
              )
              await publication.update(
                { publishedHtml: html },
                { transaction: null as any },
              )
              return { success: true as const, publicationId: publication.id }
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

              return {
                success: false as const,
                publicationId: publication.id,
              }
            }
          }),
        )

        const successful = results.filter((r) => r.success)
        this.backfillState.completed += successful.length
        this.backfillState.failed += results.length - successful.length

        if (successful.length > 0) {
          try {
            await this.backfilledModel.bulkCreate(
              successful.map((r) => ({ publicationId: r.publicationId })),
              { transaction: null as any },
            )
            this.logger.info(
              `Recorded ${successful.length} backfilled publications`,
              {
                context: LOGGING_CONTEXT,
                batchNumber: batchNumber + 1,
              },
            )
          } catch (error) {
            this.logger.error('Failed to record backfilled publications', {
              context: LOGGING_CONTEXT,
              batchNumber: batchNumber + 1,
              error: error instanceof Error ? error.message : error,
            })
          }
        }

        this.logger.info(`Batch ${batchNumber + 1}/${totalBatches} complete`, {
          context: LOGGING_CONTEXT,
          batchNumber: batchNumber + 1,
          totalBatches,
          batchCompleted: successful.length,
          batchFailed: results.length - successful.length,
          totalCompleted: this.backfillState.completed,
          totalFailed: this.backfillState.failed,
        })
      }

      this.backfillState.status = 'completed'
      this.backfillState.finishedAt = new Date().toISOString()
      this.backfillState.message = `${this.backfillState.completed} uppfærð, ${this.backfillState.failed} mistókst`

      this.logger.info('Backfill execution complete', {
        context: LOGGING_CONTEXT,
        total: this.backfillState.total,
        completed: this.backfillState.completed,
        failed: this.backfillState.failed,
      })
    } catch (error) {
      this.backfillState.status = 'failed'
      this.backfillState.finishedAt = new Date().toISOString()
      this.backfillState.message =
        error instanceof Error ? error.message : 'Unknown error'

      this.logger.error('Backfill execution failed', {
        context: LOGGING_CONTEXT,
        error,
      })
    } finally {
      this.backfillLock = false
    }
  }

  getBackfillStatus(): BackfillJobStatusDto {
    return { ...this.backfillState }
  }

  // ── History ──

  async getBackfilledPublications(
    query: BackfilledPublicationsQueryDto,
  ): Promise<BackfilledPublicationsListDto> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 50
    const offset = (page - 1) * pageSize

    const { count, rows } = await this.backfilledModel.findAndCountAll({
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: AdvertPublicationModel,
          as: 'publication',
          include: [
            {
              model: AdvertModel,
              as: 'advert',
              attributes: ['id', 'title', 'typeId'],
              include: [{ model: TypeModel }],
            },
          ],
        },
      ],
    })

    const items: BackfilledPublicationItemDto[] = rows.map((row) => ({
      id: row.id,
      publicationId: row.publicationId,
      title: row.publication?.advert?.title ?? '',
      type: (row.publication?.advert as any)?.type?.title ?? '',
      version: row.publication?.versionLetter ?? '',
      backfilledAt: row.createdAt.toISOString(),
    }))

    return { items, total: count, page, pageSize }
  }

  // ── Revert ──

  startRevert(user: DMRUser): BackfillStartResponseDto {
    if (this.revertLock) {
      return {
        started: false,
        message: 'Revert is already running',
        status: { ...this.revertState },
      }
    }

    this.revertLock = true
    this.revertState = {
      ...defaultJobStatus(),
      status: 'running',
      startedAt: new Date().toISOString(),
    }

    this.logger.info('Revert job started', {
      context: LOGGING_CONTEXT,
      adminUserId: user.adminUserId,
    })

    setImmediate(() => {
      void this.executeRevert()
    })

    return {
      started: true,
      status: { ...this.revertState },
    }
  }

  private async executeRevert(): Promise<void> {
    try {
      const total = await this.backfilledModel.count({
        transaction: null as any,
      })
      const totalBatches = Math.ceil(total / REVERT_BATCH_SIZE)

      this.revertState.total = total
      this.revertState.totalBatches = totalBatches

      this.logger.info(
        `Revert executing: ${total} records, ${totalBatches} batches`,
        { context: LOGGING_CONTEXT, total, totalBatches },
      )

      for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
        // Always offset 0: soft-deleted rows drop out
        const batch = await this.backfilledModel.findAll({
          limit: REVERT_BATCH_SIZE,
          transaction: null as any,
          include: [
            {
              model: AdvertPublicationModel,
              as: 'publication',
            },
          ],
        })

        if (batch.length === 0) {
          break
        }

        this.revertState.currentBatch = batchNumber + 1

        this.logger.info(
          `Reverting batch ${batchNumber + 1}/${totalBatches} (${batch.length} records)`,
          {
            context: LOGGING_CONTEXT,
            batchNumber: batchNumber + 1,
            totalBatches,
            batchSize: batch.length,
          },
        )

        const results = await Promise.all(
          batch.map(async (record) => {
            try {
              if (record.publication) {
                await record.publication.update(
                  { publishedHtml: null },
                  { transaction: null as any },
                )
              }
              await record.destroy({ transaction: null as any })
              return { success: true as const }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error'

              this.logger.error('Failed to revert backfilled publication', {
                context: LOGGING_CONTEXT,
                recordId: record.id,
                publicationId: record.publicationId,
                error: errorMessage,
              })

              return { success: false as const }
            }
          }),
        )

        const successful = results.filter((r) => r.success).length
        this.revertState.completed += successful
        this.revertState.failed += results.length - successful

        this.logger.info(
          `Revert batch ${batchNumber + 1}/${totalBatches} complete`,
          {
            context: LOGGING_CONTEXT,
            batchNumber: batchNumber + 1,
            totalBatches,
            batchReverted: successful,
            batchFailed: results.length - successful,
            totalReverted: this.revertState.completed,
            totalFailed: this.revertState.failed,
          },
        )
      }

      this.revertState.status = 'completed'
      this.revertState.finishedAt = new Date().toISOString()
      this.revertState.message = `${this.revertState.completed} afturkallað, ${this.revertState.failed} mistókst`

      this.logger.info('Revert execution complete', {
        context: LOGGING_CONTEXT,
        total: this.revertState.total,
        completed: this.revertState.completed,
        failed: this.revertState.failed,
      })
    } catch (error) {
      this.revertState.status = 'failed'
      this.revertState.finishedAt = new Date().toISOString()
      this.revertState.message =
        error instanceof Error ? error.message : 'Unknown error'

      this.logger.error('Revert execution failed', {
        context: LOGGING_CONTEXT,
        error,
      })
    } finally {
      this.revertLock = false
    }
  }

  getRevertStatus(): BackfillJobStatusDto {
    return { ...this.revertState }
  }
}
