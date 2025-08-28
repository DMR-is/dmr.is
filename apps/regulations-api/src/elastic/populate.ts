/* eslint-disable no-console */
import { performance } from 'perf_hooks'

import {
  ensureNameSlug,
  ensureRegName,
  slugToName,
} from '@island.is/regulations-tools/utils'

import { getAllRegulations, RegulationListItemFull } from '../db/Regulations'
import { ISODate, RegName } from '../routes/types'
import { loadData, storeData } from '../utils/misc'
import { getSettingsTemplate, mappingTemplate } from './template'

import { Client } from '@opensearch-project/opensearch'

const INDEX_NAME = 'regulations'
const DELETE_OLD_INDEX = true // flip to false to keep old snapshots

export type RegulationsIndexBody = {
  type: 'amending' | 'base'
  year: string
  name: RegName
  title: string
  text: string
  publishedDate?: ISODate
  repealedDate?: ISODate
  repealed?: boolean
  ministry?: string
  ministrySlug?: string
  lawChapters: Array<string>
  lawChaptersSlugs: Array<string>
}

const regulationToIndexItem = (reg: RegulationListItemFull) => {
  const lawChapters: Array<string> = []
  const lawChaptersSlugs: Array<string> = []
  reg.lawChapters?.forEach((chapter) => {
    lawChapters.push(chapter.name)
    lawChaptersSlugs.push(chapter.slug)
  })
  const indexBody: RegulationsIndexBody = {
    type: reg.type,
    year: reg.name.match(/\/(\d{4})/)?.[1] || '',
    name: reg.name,
    title: reg.title,
    text: reg.text ?? '',
    repealed: reg.repealed ?? false,
    repealedDate: reg.repealedDate ?? undefined,
    publishedDate: reg.publishedDate,
    ministry: reg.ministry?.name,
    ministrySlug: reg.ministry?.slug,
    lawChapters: lawChapters,
    lawChaptersSlugs: lawChaptersSlugs,
  }
  return indexBody
}

// ---------------------------------------------------------------------------

export async function repopulateElastic(client: Client) {
  const t0 = performance.now()
  const baseAlias = INDEX_NAME
  let aliasName = baseAlias
  const newIndex = `${baseAlias}-${Date.now()}`
  const logPrefix = `[repopulate:${baseAlias}]`

  let indexed = 0
  let oldIndex: string | undefined
  let success = false

  try {
    // 1) Load data (file → DB fallback)
    console.info(`${logPrefix} Fetching regulations…`)
    const fileRegs = (loadData<RegulationListItemFull[]>(
      'backup-json/all-extra.json',
    ) || undefined) as RegulationListItemFull[] | undefined

    const regulations: RegulationListItemFull[] =
      fileRegs ??
      (await getAllRegulations({ extra: true, includeRepealed: true }))

    if (!fileRegs) storeData(regulations, 'backup-json/all-extra.json')
    if (regulations.length === 0) throw new Error('No regulations to index')
    console.info(`${logPrefix} ${regulations.length} regulations found`)

    // 2) Build settings/mappings (use *_path packages so body stays small)
    const settings = await getSettingsTemplate(logPrefix)
    const mappings = mappingTemplate

    // Derive steady-state replicas (dev=0, prod(≥2 data nodes)=1)
    let steadyReplicas = 0
    try {
      const health = await client.cluster.health()
      const body = (health as any)?.body ?? health
      const dataNodes: number = body?.number_of_data_nodes ?? 1
      steadyReplicas = dataNodes >= 2 ? 1 : 0
      console.info(
        `${logPrefix} data nodes=${dataNodes} → target replicas=${steadyReplicas}`,
      )
    } catch {
      /* default 0 ok */
    }

    // 3) Create new index (cheap)
    console.info(`${logPrefix} Creating fresh index "${newIndex}"…`)
    await client.indices.create({
      index: newIndex,
      body: {
        settings: {
          ...(settings.settings ?? settings),
          index: {
            number_of_replicas: 0,
            refresh_interval: '-1',
          },
        },
        mappings,
      },
      wait_for_active_shards: '1',
      timeout: '5m',
    })

    // 4) Bulk index (helpers.bulk: low concurrency + retries)
    console.info(
      `${logPrefix} Populating "${newIndex}" with ${regulations.length} documents…`,
    )

    async function* docsGen() {
      for (const r of regulations) {
        const doc = await regulationToIndexItem(r)
        yield doc
      }
    }

    const bulkRes = await (client as any).helpers.bulk({
      datasource: docsGen(),
      onDocument: (doc: any) => ({ index: { _index: newIndex, _id: doc.id } }),
      concurrency: 2,
      flushBytes: 5_000_000,
      retries: 5,
      wait: 2000,
      onDrop: (item: any) =>
        console.error(`${logPrefix} Dropped item:`, item?.error || item),
    })
    indexed = bulkRes?.total ?? regulations.length

    // 5) Restore steady-state + make searchable
    await client.indices.putSettings({
      index: newIndex,
      body: {
        index: { number_of_replicas: steadyReplicas, refresh_interval: '1s' },
      },
    })
    await client.indices.refresh({ index: newIndex })

    // 6) Alias cut-over (handle concrete-index conflict)
    const asBool = (r: any) => (typeof r === 'boolean' ? r : !!r?.body)

    // If an index named like the alias exists, either delete (if allowed) or fall back to "<alias>_read"
    const concreteExists = asBool(
      await client.indices.exists({ index: aliasName }),
    )
    if (concreteExists) {
      if (process.env.ALLOW_DELETE_CONCRETE === 'true') {
        console.warn(
          `${logPrefix} Concrete index "${aliasName}" exists; deleting to use alias.`,
        )
        await client.indices.delete({
          index: aliasName,
          ignore_unavailable: true,
        })
      } else {
        aliasName = `${baseAlias}_read`
        console.warn(
          `${logPrefix} Concrete index named "${baseAlias}" exists; using alias "${aliasName}"`,
        )
      }
    }

    console.info(`${logPrefix} Switching alias "${aliasName}" → "${newIndex}"…`)
    const actions: any[] = [{ add: { index: newIndex, alias: aliasName } }]
    try {
      const current = await client.indices.getAlias({ name: aliasName })
      oldIndex = Object.keys((current as any).body ?? current)[0]
      if (oldIndex && oldIndex !== newIndex)
        actions.push({ remove: { index: oldIndex, alias: aliasName } })
    } catch {
      /* alias didn’t exist; first time */
    }
    await client.indices.updateAliases({ body: { actions } })

    // 7) Optional: delete old index
    if (DELETE_OLD_INDEX && oldIndex && oldIndex !== newIndex) {
      console.info(`${logPrefix} Deleting old index "${oldIndex}"…`)
      await client.indices.delete({ index: oldIndex, ignore_unavailable: true })
    }

    success = true
  } catch (err) {
    console.error(`${logPrefix} Error:`, err)
  } finally {
    const tookMs = Math.round(performance.now() - t0)
    console.info(
      `${logPrefix} ${success ? 'successful in' : 'failed after'} ${tookMs} ms (docs: ${indexed}).`,
    )
  }

  return { success, indexed, newIndex, oldIndex, alias: aliasName }
}

// ---------------------------------------------------------------------------

const _updateItem = async (client: Client, regname: RegName) => {
  const newReg = await getAllRegulations({
    extra: true,
    includeRepealed: true,
    nameFilter: [regname],
  })

  if (newReg[0]) {
    console.info(`adding ${regname} to index...`)
    const aReg = await regulationToIndexItem(newReg[0])
    await client.index({
      index: INDEX_NAME,
      body: aReg,
    })
  }
  await client.indices.refresh({ index: INDEX_NAME })
  return { success: true }
}

export async function updateElasticItem(
  client: Client,
  query: { name?: string },
) {
  const _nameSlug = ensureNameSlug(query.name)
  const name = _nameSlug ? slugToName(_nameSlug) : ensureRegName(query.name)

  if (!name) {
    return { success: false }
  }
  try {
    console.info(`deleting ${name} from index...`)
    await client.deleteByQuery({
      index: INDEX_NAME,
      body: {
        query: {
          query_string: {
            query: '"' + name + '"',
            fields: ['name'],
          },
        },
      },
    })
    await _updateItem(client, name)
  } catch (err) {
    console.info(err)
    return { success: false }
  }
  return { success: true }
}
