import { QueryTypes } from 'sequelize'

import { nameToSlug } from '@island.is/regulations-tools/utils'

import { RegName, RegQueryName } from '../routes/types'
import { db } from '../utils/sequelize'

type SQLRedirect = {
  id: number
  name: RegName
}

type Redirects = Array<RegQueryName>

export async function getRegulationsRedirects() {
  const sql = `
  (
    select r.name
    from regulation r
    where r.type = 'amending'
      and r.status <> 'draft'
  )
  union
  (
    select r.name
    from regulation r
    where exists (
      select 1
      from task t
      where t.regulationid = r.id
        and t.migrated = 1
  )
  );`

  const redirectsData = await db.query<SQLRedirect>(sql, {
    type: QueryTypes.SELECT,
  })

  const redirects: Redirects = redirectsData.map((itm) => nameToSlug(itm.name))

  return redirects
}
