// reindex-runner.service.ts
import { Inject, Injectable } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertTypeModel } from '../advert-type/models'
import { CaseModel } from '../case/models'
import { advertMigrateLean } from '../journal/migrations'
import {
  AdvertCategoryModel,
  AdvertDepartmentModel,
  AdvertInvolvedPartyModel,
  AdvertModel,
  AdvertStatusModel,
} from '../journal/models'
import {
  IReindexRunnerService,
  ReindexStatus,
} from './reindex-runner.service.interface'
import { SearchService } from './search.service'
import {
  advertMappingTemplate,
  getAdvertSettingsTemplate,
} from './search.template'
import { SearchAdvertType } from './types'

const LOGGING_CONTEXT = 'ReindexRunnerService'

@Injectable()
export class ReindexRunnerService implements IReindexRunnerService {
  private status: ReindexStatus = { state: 'idle', progress: 0 }
  private lock = false
  private lastJobId = 0

  constructor(
    private readonly scheduler: SchedulerRegistry,
    private readonly search: SearchService,
    @InjectModel(AdvertModel) private advertModel: typeof AdvertModel,
    @InjectModel(AdvertDepartmentModel)
    private advertDepartmentModel: typeof AdvertDepartmentModel, // ensures association metadata is ready
    @InjectModel(AdvertCategoryModel)
    private advertCategoryModel: typeof AdvertCategoryModel, // ensures association metadata is ready
    @InjectModel(AdvertInvolvedPartyModel)
    private advertInvolvedPartyModel: typeof AdvertInvolvedPartyModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  getStatus() {
    return { ...this.status, lock: this.lock, lastJobId: this.lastJobId }
  }

  async start(maxDocs?: number) {
    if (this.lock) throw new Error('Reindex already running')
    this.lock = true
    this.status = {
      state: 'running',
      progress: 0,
      startedAt: Date.now(),
      message: 'scheduled',
    }
    const jobId = ++this.lastJobId

    setImmediate(() => {
      void this.run(jobId, maxDocs ?? Infinity)
    })
    return { jobId }
  }

  private advertToDoc(a: AdvertModel): SearchAdvertType {
    return {
      ...advertMigrateLean(a),
      bodyText: a.documentHtml ?? '', // searchable only
      caseNumber: a.case?.caseNumber ?? null, // searchable only
    }
  }

  private async *pagedAdverts(pageSize = 200, maxDocs = Infinity) {
    let offset = 0,
      emitted = 0
    while (emitted < maxDocs) {
      const rows = await this.advertModel.findAll({
        offset,
        include: [
          {
            model: AdvertDepartmentModel,
            as: 'department',
            attributes: ['id', 'title', 'slug'],
            required: false,
          },
          {
            model: AdvertCategoryModel,
            as: 'categories',
            attributes: ['id', 'title', 'slug'],
            through: { attributes: [] },
            required: false,
          },
          {
            model: AdvertInvolvedPartyModel,
            as: 'involvedParty',
            attributes: ['id', 'title', 'slug'],
            required: false,
          },
          {
            model: AdvertStatusModel,
            as: 'status',
            attributes: ['id', 'title'],
            required: false,
          },
          {
            model: AdvertTypeModel,
            as: 'type',
            attributes: ['id', 'title', 'slug'],
            required: false,
          },
          {
            model: CaseModel,
            as: 'case',
            attributes: ['id', 'caseNumber'],
            required: false,
          },
        ],
        limit: Math.min(pageSize, maxDocs - emitted),
        order: [['id', 'ASC']],
      })
      if (!rows.length) break
      for (const r of rows) {
        yield this.advertToDoc(r)
        if (++emitted >= maxDocs) break
      }
      offset += rows.length
    }
  }

  private async run(jobId: number, maxDocs: number) {
    const alias = 'ojoi_search'
    try {
      this.logger.info('reindexing: starting...', {
        context: LOGGING_CONTEXT,
      })
      const startedAt = Date.now()
      const watchdog = setInterval(() => {
        const stalled =
          Date.now() - (this.status.startedAt ?? startedAt) > 120_000 &&
          this.status.progress < 10
        if (stalled) {
          this.status = {
            state: 'failed',
            progress: this.status.progress,
            message: 'stalled before index creation',
            startedAt: this.status.startedAt,
            finishedAt: Date.now(),
          }
          clearInterval(watchdog)
          this.lock = false
        }
      }, 15_000)
      this.status = { ...this.status, progress: 1, message: 'run() entered' } // <— visible tick
      const settings = getAdvertSettingsTemplate()
      const mappings = advertMappingTemplate
      this.logger.info('reindexing: mappings and settings set', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })

      // 1) create versioned index (cheap)
      this.status = { ...this.status, progress: 5, message: 'creating index' }
      const index = await this.search.createIndexVersion(alias, {
        settings,
        mappings,
      })
      this.status = {
        ...this.status,
        progress: 10,
        message: `created ${index}`,
      }
      this.logger.info('reindexing: create versioned index', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })

      // 2) bulk backfill (cap with maxDocs)
      const total = await this.search.bulkIndex(
        index,
        this.pagedAdverts(200, maxDocs),
      )
      this.status = {
        ...this.status,
        progress: 70,
        message: `indexed ${total}`,
      }
      this.logger.info('reindexing: bulk backfill', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })

      // 3) restore steady-state & alias cutover
      const replicas = await this.search.deriveReplicas(0)
      this.status = {
        ...this.status,
        progress: 80,
      }
      this.logger.info('reindexing: restore steady-state & alias cutover', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })
      await this.search.restoreSteadyState(index, replicas, '1s')
      this.status = {
        ...this.status,
        progress: 90,
      }
      this.logger.info('reindexing: restore steady-state finished', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })
      await this.search.aliasCutover(alias, index, true)

      this.status = {
        state: 'succeeded',
        progress: 100,
        result: { index, total, replicas },
        startedAt: this.status.startedAt,
        finishedAt: Date.now(),
      }
      this.logger.info('reindexing: succeeded', {
        context: LOGGING_CONTEXT,
        ...this.status,
      })
    } catch (e: any) {
      this.status = {
        state: 'failed',
        progress: this.status.progress,
        message: String(e?.message ?? e),
        startedAt: this.status.startedAt,
        finishedAt: Date.now(),
      }
    } finally {
      this.lock = false
    }
  }
}
