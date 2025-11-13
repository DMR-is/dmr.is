import { Injectable, Logger } from '@nestjs/common'

import { getAdvertSettingsTemplate } from './search.template'

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

  async bulkIndex(index: string, datasource: any): Promise<number> {
    const res = await (this.os as any).helpers.bulk({
      datasource,
      onDocument: (doc: any) => ({ index: { _index: index, _id: doc.id } }),
      concurrency: 2,
      flushBytes: 5_000_000,
      retries: 5,
      wait: 2000,
      onDrop: (it: any) => this.log.error(`Dropped: ${it?.error || it}`),
    })
    return res?.total ?? 0
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
