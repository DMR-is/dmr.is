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
  DbDocuments,
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
  SELECT InvolvedPartyID, InvolvedPartyName FROM Adverts  GROUP BY InvolvedPartyID, InvolvedPartyName
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
    [ModifiedDate] ASC
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

const ADVERT_DOCUMENTS_QUERY = (recordId: string) => `
SELECT TOP 1
	Documents.RecordID,
	Records.Name as FileName,
	Documents.Type,
	Records.OriginalCreationDate,
	DocumentVersions.ContentType,
	DocumentStreams.StreamData AS Stream,
	DATALENGTH(DocumentStreams.StreamData) AS FileSize
FROM Documents
INNER JOIN DocumentVersions ON DocumentVersions.VersionID = Documents.VersionID
INNER JOIN DocumentStreams ON DocumentStreams.StreamID = DocumentVersions.StreamID
INNER JOIN Records ON Records.RecordID = Documents.RecordID
INNER JOIN Metadata ON Records.RecordID = Metadata.RecordID
WHERE
	Records.MainDocumentID = '${recordId}' AND Records.Deleted = 0 AND records.ismarkedfordelete = 0
	AND MetadataName = 'IsActive' AND MetadataValue = 1

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
      department_id: type.departmentId,
      title: type.name,
      id: type.id,
      legacy_id: type.id,
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
      id: involvedParty.InvolvedPartyID,
      name: involvedParty.InvolvedPartyName,
    }
    involvedParties.push(ip)
  })
  return involvedParties
}
//TODO advert attachments
//TODO advert_categories - er ekki notað
//TODO main category - verður ekki
//TODO status history - sleppum for now
//TODO category_department - ekki mappað

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
      department_id: advert.TypeID,
      typeName: advert.Name,
      type_id: '',
      subject: advert.Subject2,
      status_id: advert.StatusID,
      serial_number: parseInt(advert.PublicationNumber.split('/')[0], 10),
      publication_year: advert.PublicationDate,
      signature_date: advert.SignatureDate,
      publication_date: advert.PublicationDate,
      involved_party_id: advert.InvolvedPartyID,
      created: advert.CreationDate,
      modified: advert.ModifiedDate,
      date: advert.PublicationDate,
      content: advert.Body,
      is_legacy: true,
      document_html: advert.Body,
      document_pdf_url: '',
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

export async function getAdvertDocuments(
  adverts: DbAdverts,
): Promise<DbDocuments> {
  const documents: DbDocuments = []
  adverts.adverts.forEach(async (item) => {
    const documentFromDB = await mssql.query(ADVERT_DOCUMENTS_QUERY(item.id))

    documents.push(documentFromDB.recordset[0])
  })
  return documents
}

export async function getAdvertsCategories() {
  const advertsCategoriesFromDb = await mssql.query(ADVERTS_CATEGORIES_QUERY)
  const records = advertsCategoriesFromDb.recordset as Array<any>
  const advertsCategories: Array<AdvertCategory> = []

  records.forEach((advertCategory) => {
    const ac = {
      advert_id: advertCategory.ad_id,
      category_id: advertCategory.category_id,
    }
    advertsCategories.push(ac)
  })
  return advertsCategories
}
