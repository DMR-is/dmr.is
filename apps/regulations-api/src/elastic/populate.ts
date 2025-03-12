/* eslint-disable no-console */
import { performance } from 'perf_hooks'
import { Client } from '@opensearch-project/opensearch'

import {
  ensureNameSlug,
  ensureRegName,
  slugToName,
} from '@island.is/regulations-tools/utils'

import { getAllRegulations, RegulationListItemFull } from '../db/Regulations'
import { ISODate, RegName } from '../routes/types'
import { loadData, storeData } from '../utils/misc'
import { getSettingsTemplate, mappingTemplate } from './template'

const INDEX_NAME = 'regulations'

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

const checkIfIndexExists = async (
  client: Client,
  index: string,
): Promise<boolean> => {
  const result = await client.indices.exists({ index })
  return result.statusCode === 200
}

export async function recreateElastic(client: Client) {
  const t0 = performance.now()
  try {
    if (await checkIfIndexExists(client, INDEX_NAME)) {
      console.info('Deleting old index...')
      await client.indices.delete({
        index: INDEX_NAME,
      })
    }

    console.info('Creating new "' + INDEX_NAME + '" index...')
    await client.indices.create({
      index: INDEX_NAME,
    })

    await client.indices.close({
      index: INDEX_NAME,
    })
    console.info('Applying settings to "' + INDEX_NAME + '" index...')
    const settingsTemplate = await getSettingsTemplate('main', 'is')
    await client.indices.putSettings({
      index: INDEX_NAME,
      body: settingsTemplate,
    })

    console.info('Applying mappings to "' + INDEX_NAME + '" index...')
    await client.indices.putMapping({
      index: INDEX_NAME,
      body: mappingTemplate,
    })
    await client.indices.open({
      index: INDEX_NAME,
    })

    console.info('refreshing indices for "' + INDEX_NAME + '" index...')
    await client.indices.refresh({ index: INDEX_NAME })

    const t1 = performance.now()
    console.info(
      'Recreating "' +
        INDEX_NAME +
        '" successful in ' +
        Math.round(t1 - t0) +
        'ms.',
    )
  } catch (err) {
    const t1 = performance.now()
    console.info(err)
    console.info(
      'Recreating "' +
        INDEX_NAME +
        '" failed in ' +
        Math.round(t1 - t0) +
        'ms.',
    )
    return { success: false }
  }
  return { success: true }
}

// ---------------------------------------------------------------------------

export async function repopulateElastic(client: Client) {
  const t0 = performance.now()
  let success = false
  try {
    console.info('fetching regulations...')
    let regulations = loadData<Array<RegulationListItemFull>>(
      'backup-json/all-extra.json',
    )
    if (!regulations) {
      console.info('fetching data from db (this takes a while)...')
      regulations = await getAllRegulations({
        extra: true,
        includeRepealed: true,
      })
      storeData(regulations, 'backup-json/all-extra.json')
    } else {
      console.info('returning data from file')
    }

    if (!regulations.length) {
      throw new Error('Error fetching regulations')
    } else {
      console.info(regulations.length + ' regulations found')
    }

    console.info(`deleting all items from ${INDEX_NAME} index...`)
    await client.deleteByQuery({
      index: INDEX_NAME,
      body: {
        query: {
          match_all: {},
        },
      },
    })

    let count = 0
    console.info(
      `populating ${INDEX_NAME} index...
      (with ${regulations.length} regulations)
      `,
    )
    for await (const reg of regulations) {
      const aReg = await regulationToIndexItem(reg)

      await client.index({
        index: INDEX_NAME,
        body: aReg,
      })
      count++
      if (count % 100 === 0) {
        console.info(`… indexed ${count} regulations`)
      }
    }

    console.info(`Refreshing ${INDEX_NAME} indices...`)
    await client.indices.refresh({ index: INDEX_NAME })

    success = true
  } catch (err) {
    console.info(err)
  }

  const resultType = success ? 'successful in' : 'failed after'
  const msElapsed = Math.round(performance.now() - t0)
  console.info(`Indexing ${INDEX_NAME} ${resultType} ${msElapsed} ms.`)

  return { success }
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
