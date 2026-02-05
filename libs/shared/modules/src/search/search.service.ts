import { Injectable, Logger } from '@nestjs/common'

import { getAdvertSettingsTemplate } from './search.template'
import { SearchAdvertType } from './types'

import { Client } from '@opensearch-project/opensearch'

@Injectable()
export class SearchService {
  private readonly log = new Logger(SearchService.name)
  constructor(private readonly os: Client) {}

  async deriveReplicas(fallback = 0): Promise<number> {
    try {
      const health: any = await this.os.cluster.health()
      const dn = (health.body ?? health)?.number_of_data_nodes ?? 1
      return dn >= 2 ? 1 : 0
    } catch {
      return fallback
    }
  }

  async createIndexVersion(
    alias: string,
    body: { settings: any; mappings: any },
  ): Promise<string> {
    const index = `${alias}-${Date.now()}`

    const templ = getAdvertSettingsTemplate()
    const analysis =
      (templ as any)?.settings?.analysis ?? (templ as any)?.analysis ?? {}
    await this.os.indices.create({
      index,
      body: {
        settings: {
          analysis,
          index: {
            number_of_replicas: 0,
            refresh_interval: '-1',
          },
        },
        mappings: body.mappings,
      },
      wait_for_active_shards: '1',
      timeout: '5m',
    })
    return index
  }

  async bulkIndex(
    index: string,
    datasource: AsyncIterable<SearchAdvertType>,
    batchSize = 50,
  ): Promise<number> {
    let body: any[] = []
    let total = 0
    let batchStart = 0

    const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + 'MB'

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    for await (const doc of datasource) {
      if (total === batchStart) {
        this.log.log(
          `Indexing batch (${batchStart}-${batchStart + batchSize - 1})...`,
        )
      }

      body.push({ index: { _index: index, _id: doc.id } })
      body.push(doc)
      total++

      if (total - batchStart >= batchSize) {
        const mem = process.memoryUsage()
        this.log.log(
          `Flushing batch (${batchStart}-${total - 1}). ` +
            `RSS=${formatMB(mem.rss)}, HeapUsed=${formatMB(mem.heapUsed)}`,
        )

        await this.flushBulk(index, body)
        body = []
        batchStart = total

        await sleep(30)
      }
    }

    if (body.length > 0) {
      this.log.log(`Indexing final batch (${batchStart}-${total - 1})...`)
      await this.flushBulk(index, body)
    }

    this.log.log(`Finished bulk index. Total docs: ${total}`)
    return total
  }

  private async flushBulk(index: string, body: any[]) {
    if (!body.length) return

    const res = await this.os.bulk({ index, body })

    if (res.body?.errors) {
      const items = res.body.items ?? []
      for (const item of items) {
        const op = item.index || item.create || item.update || item.delete
        if (op?.error) {
          this.log.error(
            `Bulk error [${op.status}]: ${JSON.stringify(op.error)}`,
          )
        }
      }
    }
  }

  async deleteItemFromIndex(id: string, index: string) {
    try {
      this.log.log(`deleting ${id} from index...`)
      await this.os.deleteByQuery({
        index,
        body: {
          query: {
            query_string: {
              query: '"' + id + '"',
              fields: ['id'],
            },
          },
        },
      })
      await this.os.indices.refresh({ index })
    } catch (e) {
      this.log.error(`Failed to delete item ${id} in index ${index}: ${e}`)
      throw e
    }
  }

  async updateItem(data: SearchAdvertType, index: string) {
    try {
      this.log.log(`deleting ${data.id} from index...`)
      await this.os.deleteByQuery({
        index,
        body: {
          query: {
            query_string: {
              query: '"' + data.id + '"',
              fields: ['id'],
            },
          },
        },
      })
      this.log.log(`adding ${data.id} to index...`)
      await this.os.index({
        index: index,
        body: data,
      })
      await this.os.indices.refresh({ index })
    } catch (e) {
      this.log.error(`Failed to update item ${data.id} in index ${index}: ${e}`)
      throw e
    }
  }

  private asBool(r: any) {
    return typeof r === 'boolean' ? r : !!r?.body
  }
  async aliasCutover(alias: string, newIndex: string, deleteOld = true) {
    const concreteExists = this.asBool(
      await this.os.indices.exists({ index: alias }),
    )
    if (concreteExists) {
      if (process.env.ALLOW_DELETE_CONCRETE === 'true') {
        await this.os.indices.delete({ index: alias, ignore_unavailable: true })
      } else {
        throw new Error(
          `Concrete index "${alias}" exists. Set ALLOW_DELETE_CONCRETE=true or rename alias.`,
        )
      }
    }

    const actions: any[] = [{ add: { index: newIndex, alias } }]
    try {
      const current: any = await this.os.indices.getAlias({ name: alias })
      const oldIndex = Object.keys(current.body ?? current)[0]
      if (oldIndex && oldIndex !== newIndex)
        actions.push({ remove: { index: oldIndex, alias } })
      await this.os.indices.updateAliases({ body: { actions } })
      if (deleteOld && oldIndex && oldIndex !== newIndex)
        await this.os.indices.delete({
          index: oldIndex,
          ignore_unavailable: true,
        })
    } catch {
      await this.os.indices.updateAliases({ body: { actions } })
    }
  }

  async restoreSteadyState(index: string, replicas: number, refresh = '1s') {
    await this.os.indices.putSettings({
      index,
      body: {
        index: { number_of_replicas: replicas, refresh_interval: refresh },
      },
    })
    await this.os.indices.refresh({ index })
  }
}
