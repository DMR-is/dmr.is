import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { hrtime } from 'node:process'

import {
  connect,
  getAdvertDocuments,
  getAdverts,
  getAdvertsCategories,
  getAdvertStatuses,
  getCategories,
  getDepartments,
  getInvolvedParties,
  getTypes,
} from './lib/db.js'
import { getEnv } from './lib/environment.js'
import {
  fixAdverts,
  fixCats,
  fixDeps,
  fixInvolvedParties,
  fixTypes,
  mapAdvertsCategories,
} from './lib/fixers.js'
import {
  generateAdvertsCategoriesInserts,
  generateAdvertsInserts,
  generateAdvertStatusesInserts,
  generateCategoryInserts,
  generateDepartmentInserts,
  generateInvolvedPartiesInserts,
  generateTypeInserts,
} from './lib/inserts.js'

const ROOT_SQL_DIR = './apps/official-journal-api-export/sql'

function log(message: string) {
  // eslint-disable-next-line no-console
  console.log(message)
}

function write(path: string, data: string) {
  const joinedPath = join(ROOT_SQL_DIR, path)
  return writeFile(joinedPath, data, { flag: 'w+' })
}

async function exec<T = unknown>(
  action: string,
  fn: () => Promise<T>,
  emoji = '⏰',
) {
  log(`${emoji} starting ${action}`)
  const start = hrtime.bigint()
  const result = await fn()
  const end = hrtime.bigint()

  const elapsedInSec = (Number(end - start) / 1e9).toFixed(2)

  const lengtString = Array.isArray(result) ? ` (${result.length} records)` : ''

  log(`${emoji} finished ${action} in ${elapsedInSec} seconds${lengtString}`)
  return result
}

async function main() {
  const env = getEnv()

  await exec('connecting to db', () => connect(env.mssqlConnectionString))

  // Step 1.1: Select all legacy data from GoPro
  const dbDepartments = await exec('get departments', getDepartments)
  const dbTypes = await exec('get types', getTypes)
  const dbCategories = await exec('get categories', getCategories)
  const dbAdvertStatuses = await exec('get advert statuses', getAdvertStatuses)
  const dbInvolvedParties = await exec(
    'get involved parties',
    getInvolvedParties,
  )
  const dbAdvertsCategories = await exec(
    'get adverts categories',
    getAdvertsCategories,
  )

  // TODO page this
  const dbAdverts = await exec('get adverts', () => getAdverts(1000, 0))
  dbAdverts.adverts = await exec('getDocuments', () =>
    getAdvertDocuments(dbAdverts),
  )
  // Step 1.2: Select our custom data
  //const superCategories = await exec('get super categories', getSuperCategories)
  // Step 2: Fix, map and wrangle the data
  const departments = await exec('fix deps', () => fixDeps(dbDepartments))
  const fixedTypes = await exec('fix types', () =>
    fixTypes(dbTypes, dbDepartments),
  )
  const cats = await exec('fix cats', () => fixCats(dbCategories))
  const parties = await exec('fix involved parties', () =>
    fixInvolvedParties(dbInvolvedParties),
  )
  const adverts = await exec('fix adverts', () =>
    fixAdverts(fixedTypes, dbAdverts),
  )
  const advertsCategories = mapAdvertsCategories(
    adverts,
    cats,
    dbAdvertsCategories,
  )

  // const categoryDepartments = mapCategoryDepartments(dbCategories, departments)
  // Step 3: Generate the inserts
  const inserts: Record<string, string[]> = {}

  await exec(
    'generating inserts',
    () => {
      inserts.departments = generateDepartmentInserts(departments)
      inserts.types = generateTypeInserts(fixedTypes.types)
      //inserts.superCategories = generateSuperCategoryInserts(superCategories)
      inserts.categories = generateCategoryInserts(cats)
      inserts.advertStatuses = generateAdvertStatusesInserts(dbAdvertStatuses)
      inserts.involvedParties = generateInvolvedPartiesInserts(parties)
      inserts.adverts = generateAdvertsInserts(adverts)
      inserts.advertsCategories =
        generateAdvertsCategoriesInserts(advertsCategories)
      /*inserts.categoryDepartments =
        generateCategoryDepartmentInserts(categoryDepartments)*/
      return Promise.resolve()
    },
    '🔨',
  )

  // Step 4: Write the SQL files
  await exec(
    'writing sql files',
    () => {
      write('00_departments.sql', inserts.departments.join('\n'))
      write('01_types.sql', inserts.types.join('\n'))
      //write('02_main_categories.sql', inserts.superCategories.join('\n'))
      write('03_categories.sql', inserts.categories.join('\n'))
      write('04_advert_statuses.sql', inserts.advertStatuses.join('\n'))
      write('05_involved_parties.sql', inserts.involvedParties.join('\n'))
      write('06_adverts.sql', inserts.adverts.join('\n'))
      write('07_adverts_categories.sql', inserts.advertsCategories.join('\n'))
      write(
        'all.sql',
        `${inserts.departments.join('\n')}\n${inserts.types.join(
          '\n',
        )}${inserts.categories.join('\n')}\n${inserts.advertStatuses.join(
          '\n',
        )}\n${inserts.involvedParties.join('\n')}\n${inserts.adverts.join(
          '\n',
        )}\n${inserts.advertsCategories.join('\n')}`,
      )
      return Promise.resolve()
    },
    '📝',
  )

  // Step 5: Dump the PDF binary data
}

// eslint-disable-next-line no-console
main().catch(console.error)
