/* eslint-disable no-console */
import { BindOrReplacements, QueryTypes } from 'sequelize'

import { eliminateComments } from '@island.is/regulations-tools/textHelpers'

import { DB_Regulation, DB_Task } from '../models'
import {
  ISODate,
  LawChapter,
  RegName,
  RegulationListItem,
  RegulationOptionList,
  RegulationYears,
  Year,
} from '../routes/types'
import { db } from '../utils/sequelize'
import { getRegulationLawChapters } from './LawChapter'
import { getMinistry } from './Ministry'

import promiseAll from '@hugsmidjan/qj/promiseAllObject'

export const PER_PAGE = 30

export async function getRegulationsCount() {
  const regulationsCount = await DB_Regulation.count()
  return regulationsCount
}

export async function getRegulationsYears(): Promise<RegulationYears> {
  const years = await db.query<{ year: Year }>(
    `SELECT DISTINCT EXTRACT(YEAR FROM publishedDate) AS year
      FROM regulation
      ORDER BY year DESC`,
    { type: QueryTypes.SELECT },
  )
  return (
    years
      .map((y) => y.year)
      // filter out bad years cruft (0008 et. al.)
      .filter((y) => y > 1800)
  )
}

// ---------------------------------------------------------------------------

type SQLRegulationsItem = Pick<
  DB_Regulation,
  | 'id'
  | 'name'
  | 'type'
  | 'title'
  | 'ministryid'
  | 'publishedDate'
  | 'effectiveDate'
  | 'repealedBeacuseReasons'
> & {
  repealedDate?: ISODate | null
  text?: DB_Regulation['text']
  migrated?: DB_Task['done']
}

export type SQLRegulationsList = ReadonlyArray<SQLRegulationsItem>

export type RegulationListItemFull = Omit<RegulationListItem, 'ministry'> & {
  type: 'amending' | 'base'
  ministry?: RegulationListItem['ministry']
  text?: DB_Regulation['text']
  effectiveDate: ISODate
  repealedDate?: ISODate | null
  repealed?: boolean | null
  lawChapters?: ReadonlyArray<LawChapter>
}

const augmentRegulationList = async (
  regulations: SQLRegulationsList,
  opts: { text?: boolean; lawChapters?: boolean; ministry?: boolean } = {},
) => {
  const chunkSize = 200
  const augmentedRegulations: Array<RegulationListItemFull> = []
  const today = new Date()

  for (let i = 0; i < regulations.length; i += chunkSize) {
    console.info(`- Augmenting chunk ${i} - ${i + chunkSize}`)
    const regChunk = regulations.slice(i, i + chunkSize)

    const regProms = regChunk.map(async (reg) => {
      const {
        type,
        migrated,
        name,
        title,
        text,
        publishedDate,
        effectiveDate,
        repealedDate,
        repealedBeacuseReasons,
      } = reg

      const { ministry, lawChapters } = await promiseAll({
        ministry: opts.ministry ? getMinistry(reg.ministryid) : undefined, //
        lawChapters: opts.lawChapters
          ? getRegulationLawChapters(reg.id)
          : undefined,
      })

      const textWithoutComments =
        !opts.text || !text
          ? undefined
          : migrated
            ? eliminateComments(text)
            : // Pass through bare+dirty text from unmigrated regulations.
              // people need the text to be searchable even if it isn't perfect
              text

      const itm: RegulationListItemFull = {
        type,
        title,
        text: textWithoutComments,
        name,
        publishedDate,
        effectiveDate,
        repealedDate: repealedDate ?? undefined,
        repealed: repealedDate
          ? new Date(repealedDate) <= today
          : !!repealedBeacuseReasons,
        ministry,
        lawChapters,
      }
      return itm
    })

    const augmentedChunk = await Promise.all(regProms)

    augmentedRegulations.push(...augmentedChunk)
    console.info(`Processed ${augmentedRegulations.length} regulations`)
  }
  console.info('Done augmenting regulations list')
  return augmentedRegulations
}

// ---------------------------------------------------------------------------

export async function getNewestRegulations(opts: {
  skip?: number
  take?: number
}) {
  const { skip = 0, take = PER_PAGE } = opts

  const regulations = await DB_Regulation.findAll({
    // NOTE: This is leaky - as both title and ministryId might have changed
    attributes: [
      'id',
      'type',
      'name',
      'title',
      'publishedDate',
      'effectiveDate',
      'ministryid',
    ],
    order: [
      ['publishedDate', 'DESC'],
      ['id', 'DESC'],
    ],
    offset: skip,
    limit: take,
  })

  return await augmentRegulationList(regulations, { ministry: true })
}

const selectChangeColumn = (col: string) => `
COALESCE(
  (
    SELECT ch.${col}
    FROM RegulationChange AS ch
    JOIN Regulation AS changing_r ON changing_r.id = ch.changingId
    WHERE
      ch.regulationId = r.id
      AND ch.date <= now()
      AND ch.${col} != ''
    ORDER BY
      ch.date DESC,
      changing_r.publishedDate DESC,
      ch.id DESC
    LIMIT 1
  ),
  r.${col}
)
`

/**
 * Returns all base regulations
 * @param {boolean} full - Include text and minitry info
 * @param {boolean} extra - Also includes lawchapter info
 * @param {boolean} includeRepealed - Include amending and repealed regulations
 * @returns {SQLRegulationsList | RegulationListItemFull[]}
 */
export async function getAllRegulations(opts?: {
  full?: boolean
  extra?: boolean
  includeRepealed?: boolean
  nameFilter?: Array<RegName>
}) {
  const { full, extra, includeRepealed, nameFilter } = opts || {}

  const whereConds: Array<string> = []
  const replacements: BindOrReplacements = {}

  if (!includeRepealed) {
    whereConds.push(`r.repealedBeacuseReasons = FALSE`)
    whereConds.push(`(c.id is null or now() < c.date)`)
  }
  if (nameFilter) {
    whereConds.push(`r.name IN (:nameFilter)`)
    replacements.nameFilter = nameFilter
  }

  const sql = `
    select
      r.id,
      r.name,
      ${selectChangeColumn('title')} as title,
      ${
        // Inefficient repetition, but works. TODO: Make this more fancy with Blackjack and CTEs??
        full || extra ? `${selectChangeColumn('text')} as text,` : ``
      }
      t.done as migrated,
      r.type,
      r.ministryid,
      r.publishedDate,
      r.effectiveDate,
      c.date as repealedDate,
      r.repealedbeacusereasons
    from Regulation as r
    left join RegulationCancel as c on c.regulationId = r.id
    left join Task as t on t.regulationId = r.id
    ${whereConds.length ? 'where ' + whereConds.join(' and ') : ''}
    order by r.publishedDate DESC, r.id DESC
  ;`

  let regulations = await db.query<SQLRegulationsItem>(sql, {
    replacements,
    type: QueryTypes.SELECT,
  })

  console.info(`Fetched ${regulations.length} regulations from DB`)

  // FIXME: Remove this block once the Reglugerðagrunnur has been cleaned up
  // so that RegulationCancel.regulationId values are unique
  // (i.e. only one cancellation per regulation).
  if (includeRepealed) {
    const found: Record<string, true | undefined> = {}
    regulations = regulations.filter((item) => {
      if (!found[item.name]) {
        found[item.name] = true
        return true
      }
    })
  }

  return await augmentRegulationList(regulations, {
    text: full || extra,
    ministry: full || extra,
    lawChapters: extra,
  })
}

/**
 * Returns RegulationsOptionsList[] based on RegName[]
 * @returns {RegulationsOptionsList[]}
 */
export async function getRegulationsOptionsList(
  nameFilter: Array<RegName>,
): Promise<RegulationOptionList> {
  const sql = `
    select
      r.id,
      r.name,
      ${selectChangeColumn('title')} as title,
      r.type,
      t.done as migrated,
      ch.date as repealedDate,
      r.repealedBeacuseReasons
    from Regulation as r
    left join RegulationCancel as ch on ch.regulationId = r.id
    left join Task as t on t.regulationId = r.id
    where r.name IN (:nameFilter)
  ;`

  const today = new Date()

  const regulationsOptions = await db.query<
    Pick<
      SQLRegulationsItem,
      | 'id'
      | 'name'
      | 'title'
      | 'type'
      | 'migrated'
      | 'repealedDate'
      | 'repealedBeacuseReasons'
    >
  >(sql, {
    replacements: { nameFilter },
    type: QueryTypes.SELECT,
  })

  const opts = regulationsOptions.map(async (opt) => {
    return {
      title: opt.title,
      name: opt.name,
      type: opt.type,
      migrated: !!opt.migrated,
      repealed:
        (opt.repealedDate && new Date(opt.repealedDate) <= today) ||
        !!opt.repealedBeacuseReasons
          ? true
          : undefined,
      // LawChapters used for suggesting chapters in admin
      lawChapters: await getRegulationLawChapters(opt.id),
    }
  })

  const augmentedOpts: RegulationOptionList = await Promise.all(opts)

  return augmentedOpts
}
