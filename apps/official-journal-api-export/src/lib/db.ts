/* eslint-disable @typescript-eslint/no-explicit-any */
import mssql from 'mssql'

import {
  DbDepartment,
  DbType,
  DbCategory,
  DbAdverts,
  DbAdvert,
  DbStatus,
  DbInvolvedParty,
  AdvertCategory,
} from '../types'

const DEPARTMENT_QUERY =
  'SELECT typename AS name, typeid AS id, COUNT(*) AS count FROM Adverts GROUP BY typename, typeid'

const TYPE_QUERY = `
  SELECT
    TypeName AS departmentName, TypeId AS departmentId, name, count(*) AS count,
    (SELECT TOP 1 RecordId FROM Records where Name = Adverts.Name) AS id
  FROM Adverts
  GROUP BY TypeName, TypeId, name
  ORDER BY TypeName, COUNT(*) DESC
`

const CATEGORY_QUERY = `
  SELECT
    listvalues.[ListValue] AS name, listvalues.ListValueID AS id, count(*) AS count
  FROM
    Adverts
  LEFT JOIN
    Keywords on Keywords.RecordID = adverts.RecordID
  LEFT JOIN
    listvalues on listvalues.ListValueID = keywords.KeywordID
  WHERE
      listvalues.[ListValue] IS NOT NULL AND listvalues.ListValueID IS NOT NULL
  GROUP BY
    listvalues.[ListValue], listvalues.ListValueID
  ORDER BY
    COUNT(*) desc
`

const STATUSES_QUERY = `select StatusID, StatusName from adverts group by StatusID, StatusName`

const INVOLVED_PARTIES_QUERY = `
  -- InvolvedParties should be the same as UserGroups, but in some cases they are not, they're still the person responsible for the advert
  SELECT UserGroupID, UserGroupName FROM Adverts GROUP BY UserGroupID, UserGroupName;
`

const ADVERTS_QUERY = (limit = 10, offset = 0) => `
  SELECT
    [ModifiedDate],
    [RecordID],
    [CaseNumber],
    [Name],
    [CreationDate],
    [StatusID],
    [StatusName],
    [ResponsibleName],
    [TypeName],
    [CaseTemplateID],
    [TypeID],
    [InvolvedPartyName],
    [InvolvedPartyID],
    [CategoryName],
    [PublicationDate],
    [PrintingChar],
    [Printing],
    [SignatureDate],
    [Body],
    [UserGroupID],
    [UserGroupName],
    [CategoryID],
    [PublicationNumber],
    [Subject2]
  FROM
    [Adverts]
  ORDER BY
    [ModifiedDate] DESC
  OFFSET ${offset} ROWS
  FETCH NEXT ${limit} ROWS ONLY
`

const ADVERTS_CATEGORIES_QUERY = `
  SELECT
    adverts.RecordID AS ad_id, listvalues.[ListValueID] as category_id, listvalues.[ListValue] as category_name
  FROM
    Adverts
  LEFT JOIN
    Keywords on Keywords.RecordID = adverts.RecordID
  LEFT JOIN
    listvalues on listvalues.ListValueID = keywords.KeywordID
  WHERE
    listvalues.ListValueID IS NOT NULL
`

export async function connect(mssqlConnectionString: string) {
  await mssql.connect(mssqlConnectionString)
}

export async function getDepartments(): Promise<Array<DbDepartment>> {
  const departments = await mssql.query(DEPARTMENT_QUERY)
  const records = departments.recordset as Array<any>
  const deps: Array<DbDepartment> = []
  records.forEach((department) => {
    const dep = {
      id: department.id,
      title: department.name,
      count: department.count,
    }
    deps.push(dep)
  })
  return deps
}

export async function getTypes() {
  const typesFromDb = await mssql.query(TYPE_QUERY)
  const records = typesFromDb.recordset as Array<any>
  const types: Array<DbType> = []

  records.forEach((type) => {
    const t = {
      departmentName: type.departmentName,
      departmentId: type.departmentId,
      title: type.name,
      count: type.count,
      id: type.id,
      legacyId: type.id,
    }
    types.push(t)
  })
  return types
}

export async function getCategories(): Promise<DbCategory[]> {
  const categoriesFromDb = await mssql.query(CATEGORY_QUERY)
  const records = categoriesFromDb.recordset as Array<any>
  const categories: Array<DbCategory> = []

  records.forEach((category) => {
    const c = {
      id: category.id,
      title: category.name,
      count: category.count,
    }
    categories.push(c)
  })
  return categories
}

export async function getAdvertStatuses(): Promise<DbStatus[]> {
  const statusesFromDb = await mssql.query(STATUSES_QUERY)

  const records = statusesFromDb.recordset as Array<any>
  const statuses: Array<DbStatus> = []
  records.forEach((status) => {
    const s = {
      id: status.StatusID,
      title: status.StatusName,
    }
    statuses.push(s)
  })
  return statuses
}

export async function getInvolvedParties(): Promise<DbInvolvedParty[]> {
  const involvedPartiesFromDb = await mssql.query(INVOLVED_PARTIES_QUERY)

  const records = involvedPartiesFromDb.recordset as Array<any>
  const involvedParties: Array<DbInvolvedParty> = []
  records.forEach((involvedParty) => {
    const ip = {
      id: involvedParty.UserGroupID,
      name: involvedParty.UserGroupName,
    }
    involvedParties.push(ip)
  })
  return involvedParties
}

export async function getAdverts(
  limit: number,
  offset = 0,
): Promise<DbAdverts> {
  const advertsFromDb = await mssql.query(ADVERTS_QUERY(limit, offset))
  const advertsCount = await mssql.query(
    'SELECT COUNT(*) as count FROM Adverts',
  )

  const records = advertsFromDb.recordset as Array<any>
  const adverts: Array<DbAdvert> = []

  records.forEach((advert) => {
    const a = {
      id: advert.RecordID,
      departmentId: advert.TypeID,

      // This will be fixed later in the process
      typeId: '',
      typeName: advert.Name,

      // categoryId: advert.CategoryID,

      subject: advert.Subject2,
      statusId: advert.StatusID,
      serialNumber: advert.PublicationNumber,
      publicationYear: advert.PublicationDate,
      signatureDate: advert.SignatureDate,
      publicationDate: advert.PublicationDate,
      involvedPartyId: advert.InvolvedPartyID,
      createdDate: advert.CreationDate,
      modifiedDate: advert.ModifiedDate,
      date: advert.PublicationDate,
      url: '',
      content: advert.Body,
      html: advert.Body,
    }
    adverts.push(a)
  })

  return {
    adverts,
    limit,
    offset,
    total: advertsCount.recordset[0].count,
  }
}

export async function getAdvertsCategories() {
  const advertsCategoriesFromDb = await mssql.query(ADVERTS_CATEGORIES_QUERY)
  const records = advertsCategoriesFromDb.recordset as Array<any>
  const advertsCategories: Array<AdvertCategory> = []

  records.forEach((advertCategory) => {
    const ac = {
      advertId: advertCategory.ad_id,
      categoryId: advertCategory.category_id,
    }
    advertsCategories.push(ac)
  })
  return advertsCategories
}
