import { hrtime } from 'node:process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  connect,
  getAdvertStatuses,
  getAdverts,
  getAdvertsCategories,
  getCategories,
  getDepartments,
  getInvolvedParties,
  getTypes,
} from './lib/db.js'
import { getEnv } from './lib/environment.js'
import {
  generateAdvertStatusesInserts,
  generateAdvertsCategoriesInserts,
  generateAdvertsInserts,
  generateCategoryInserts,
  generateDepartmentInserts,
  generateInvolvedPartiesInserts,
  generateSuperCategoryInserts,
  generateTypeInserts,
} from './lib/inserts.js'
import {
  fixAdverts,
  fixCats,
  fixDeps,
  fixTypes,
  mapAdvertsCategories,
} from './lib/fixers.js'
import { getSuperCategories } from './lib/static.js'

const ROOT_SQL_DIR = './apps/official-journal-api-export/sql'

function log(message: string) {
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
  const dbAdverts = await exec('get adverts', () => getAdverts(10, 0))

  // Step 1.2: Select our custom data
  const superCategories = await exec('get super categories', getSuperCategories)

  // Step 2: Fix, map and wrangle the data
  const departments = await exec('fix deps', () => fixDeps(dbDepartments))
  const fixedTypes = await exec('fix types', () => fixTypes(dbTypes))
  const cats = await exec('fix cats', () =>
    fixCats(dbCategories, superCategories),
  )
  const adverts = await exec('fix adverts', () =>
    fixAdverts(fixedTypes.types, dbAdverts),
  )
  const advertsCategories = mapAdvertsCategories(
    adverts,
    cats,
    dbAdvertsCategories,
  )

  // Step 3: Generate the inserts
  const inserts: Record<string, string[]> = {}

  await exec(
    'generating inserts',
    () => {
      inserts.departments = generateDepartmentInserts(departments)
      inserts.types = generateTypeInserts(fixedTypes.types)
      inserts.superCategories = generateSuperCategoryInserts(superCategories)
      inserts.categories = generateCategoryInserts(cats)
      inserts.advertStatuses = generateAdvertStatusesInserts(dbAdvertStatuses)
      inserts.involvedParties =
        generateInvolvedPartiesInserts(dbInvolvedParties)
      inserts.adverts = generateAdvertsInserts(adverts)
      inserts.advertsCategories =
        generateAdvertsCategoriesInserts(advertsCategories)
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
      write('02_main_categories.sql', inserts.superCategories.join('\n'))
      write('03_categories.sql', inserts.categories.join('\n'))
      write('04_advert_statuses.sql', inserts.advertStatuses.join('\n'))
      write('05_involved_parties.sql', inserts.advertStatuses.join('\n'))
      write('06_adverts.sql', inserts.adverts.join('\n'))
      write('07_adverts_categories.sql', inserts.adverts.join('\n'))
      return Promise.resolve()
    },
    '📝',
  )

  // Step 5: Dump the PDF binary data
}

main().catch(console.error)
