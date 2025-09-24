/* eslint-disable @typescript-eslint/no-explicit-any */
import mssql from 'mssql'

import {
  AdvertCategory,
  CategoryAndType,
  Correction,
  DbAdvert,
  DbAdverts,
  DbCategory,
  DbCorrections,
  DbDepartment,
  DbInvolvedParty,
  DbStatus,
  DbSubscriber,
  DbType,
  Document,
  LBCategory,
  LBType,
  LogbirtingAdvert,
} from '../types'

const SUBSCRIBER_QUERY = `SELECT RecordID, UserName, FullName, Email, [Password], SubscriptionValidFrom, SubscriptionValidTo, Blocked, FreeSubscription,
		   IDNumber, FirstName, MiddleName, LastName, ContactName, PhoneNumber, StreetName, StreetNumber, PostCode, [Floor], City
	FROM ClientsView where SubscriptionValidTo > '2025-08-01 12:00:00.000'`

const DEPARTMENT_QUERY =
  'SELECT typename AS name, typeid AS id, COUNT(*) AS count FROM Adverts GROUP BY typename, typeid'

const CORRECTIONS_QUERY = `select RecordID,MetadataValue from Metadata where MetadataName = 'Corrections' and MetadataValue != '<rows />'`

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

const LOGBIRTING_QUERY = `
SELECT TOP 1000
dbo.Records.ModifiedDate,
		dbo.Cases.RecordID,
		dbo.Cases.CaseNumber,
		dbo.Records.Name,
		dbo.Records.CreationDate,
		dbo.Records.StatusID,
    l1.ListValue AS StatusName,
    Responsibles.Name AS ResponsibleName,
		CaseTypes.Name AS TypeName,
    l2.ListValue AS Category,
    l2.ListValueID as CategoryID,
		dbo.Cases.CaseTemplateID,
		dbo.Cases.CaseTemplateID AS TypeID,
    Clients.Name AS InvolvedPartyName,
		Clients.RecordID AS InvolvedPartyID,
        ClientID.IDNumber as SSN,
		CaseCategories.Name AS CategoryName,
		dbo.PublicationDates.PublicationDate,
		ISNULL(dbo.PublicationDates.PrintingChar, '') AS PrintingChar,
		dbo.PublicationDates.Printing,
		dbo.SignatureDates.SignatureDate,
		dbo.AdvertHtmlCache.Body,
		dbo.AdvertUserGroups.UserGroupID,
		dbo.AdvertUserGroups.UserGroupName,
	    m1.MetadataValue AS PublicationNumber,
        m2.MetadataValue AS Subject2
FROM    dbo.Cases INNER JOIN
        dbo.Records ON dbo.Records.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.Keywords k on k.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.ListValues l2 on l2.ListValueID = k.KeywordID LEFT JOIN
        dbo.ListValues l1 ON l1.ListValueID = dbo.Records.StatusID INNER JOIN
        dbo.Records AS Responsibles ON Responsibles.RecordID = dbo.Cases.ResponsibleWorkerID INNER JOIN
        dbo.OrganisationalUnits ON dbo.OrganisationalUnits.OrganisationalUnitID = dbo.Records.OrganisationalUnitID LEFT OUTER JOIN
        dbo.PublicationDates ON dbo.PublicationDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.SignatureDates ON dbo.SignatureDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.AdvertUserGroups ON dbo.AdvertUserGroups.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Records AS CaseTypes ON CaseTypes.RecordID = dbo.Cases.CaseTemplateID LEFT OUTER JOIN
        dbo.Records AS Clients ON Clients.RecordID = dbo.Cases.ClientID LEFT OUTER JOIN
        dbo.Clients as ClientID on Clients.RecordID = ClientID.RecordID LEFT OUTER JOIN
        dbo.RecordJournalKeys ON dbo.RecordJournalKeys.RecordID = dbo.Records.RecordID AND dbo.RecordJournalKeys.IsPrimary = 1 LEFT OUTER JOIN
        dbo.Categories ON dbo.Categories.RecordID = dbo.RecordJournalKeys.CategoryID LEFT OUTER JOIN
        dbo.Records AS CaseCategories ON CaseCategories.RecordID = dbo.Cases.CategoryID LEFT OUTER JOIN
        dbo.AdvertHtmlCache ON (dbo.AdvertHtmlCache.PrintingChar = dbo.PublicationDates.PrintingChar)  AND dbo.AdvertHtmlCache.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Metadata m1 on (dbo.Records.RecordID = m1.RecordID and m1.MetadataName = 'PublishingCaseNumber') LEFT OUTER JOIN
        dbo.Metadata m2 on (dbo.Records.RecordID = m2.RecordID and m2.MetadataName = 'Subject2')
WHERE Records.Deleted = 0 and Records.IsMarkedForDelete = 0 AND Records.RecordType = '3B0F842A-CDAB-420F-88BC-930E259F5782' and l1.ListValue = 'Útgefin'`

const LOGBIRTING_TYPE_AND_CATEGORY_QUERY = `
SELECT

        CaseTypes.RecordID as TypeId,

        l2.ListValueID as CategoryID
FROM    dbo.Cases INNER JOIN
        dbo.Records ON dbo.Records.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.Keywords k on k.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.ListValues l2 on l2.ListValueID = k.KeywordID LEFT JOIN
        dbo.ListValues l1 ON l1.ListValueID = dbo.Records.StatusID INNER JOIN
        dbo.Records AS Responsibles ON Responsibles.RecordID = dbo.Cases.ResponsibleWorkerID INNER JOIN
        dbo.OrganisationalUnits ON dbo.OrganisationalUnits.OrganisationalUnitID = dbo.Records.OrganisationalUnitID LEFT OUTER JOIN
        dbo.PublicationDates ON dbo.PublicationDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.SignatureDates ON dbo.SignatureDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.AdvertUserGroups ON dbo.AdvertUserGroups.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Records AS CaseTypes ON CaseTypes.RecordID = dbo.Cases.CaseTemplateID LEFT OUTER JOIN
        dbo.Records AS Clients ON Clients.RecordID = dbo.Cases.ClientID LEFT OUTER JOIN
        dbo.RecordJournalKeys ON dbo.RecordJournalKeys.RecordID = dbo.Records.RecordID AND dbo.RecordJournalKeys.IsPrimary = 1 LEFT OUTER JOIN
        dbo.Categories ON dbo.Categories.RecordID = dbo.RecordJournalKeys.CategoryID LEFT OUTER JOIN
        dbo.Records AS CaseCategories ON CaseCategories.RecordID = dbo.Cases.CategoryID LEFT OUTER JOIN
        dbo.AdvertHtmlCache ON (dbo.AdvertHtmlCache.PrintingChar = dbo.PublicationDates.PrintingChar)  AND dbo.AdvertHtmlCache.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Metadata m1 on (dbo.Records.RecordID = m1.RecordID and m1.MetadataName = 'PublishingCaseNumber') LEFT OUTER JOIN
        dbo.Metadata m2 on (dbo.Records.RecordID = m2.RecordID and m2.MetadataName = 'Subject2')
WHERE Records.Deleted = 0 and Records.IsMarkedForDelete = 0 AND Records.RecordType = '3B0F842A-CDAB-420F-88BC-930E259F5782' AND l2.ListValue IS NOT NULL and l1.ListValue = 'Útgefin'
GROUP BY CaseTypes.RecordID, l2.ListValueID`

const LOGBIRTING_TYPE_QUERY = `
SELECT
		CaseTypes.Name AS TypeName,
        CaseTypes.RecordID as TypeId
FROM    dbo.Cases INNER JOIN
        dbo.Records ON dbo.Records.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.Keywords k on k.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.ListValues l2 on l2.ListValueID = k.KeywordID LEFT JOIN
        dbo.ListValues l1 ON l1.ListValueID = dbo.Records.StatusID INNER JOIN
        dbo.Records AS Responsibles ON Responsibles.RecordID = dbo.Cases.ResponsibleWorkerID INNER JOIN
        dbo.OrganisationalUnits ON dbo.OrganisationalUnits.OrganisationalUnitID = dbo.Records.OrganisationalUnitID LEFT OUTER JOIN
        dbo.PublicationDates ON dbo.PublicationDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.SignatureDates ON dbo.SignatureDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.AdvertUserGroups ON dbo.AdvertUserGroups.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Records AS CaseTypes ON CaseTypes.RecordID = dbo.Cases.CaseTemplateID LEFT OUTER JOIN
        dbo.Records AS Clients ON Clients.RecordID = dbo.Cases.ClientID LEFT OUTER JOIN
        dbo.RecordJournalKeys ON dbo.RecordJournalKeys.RecordID = dbo.Records.RecordID AND dbo.RecordJournalKeys.IsPrimary = 1 LEFT OUTER JOIN
        dbo.Categories ON dbo.Categories.RecordID = dbo.RecordJournalKeys.CategoryID LEFT OUTER JOIN
        dbo.Records AS CaseCategories ON CaseCategories.RecordID = dbo.Cases.CategoryID LEFT OUTER JOIN
        dbo.AdvertHtmlCache ON (dbo.AdvertHtmlCache.PrintingChar = dbo.PublicationDates.PrintingChar)  AND dbo.AdvertHtmlCache.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Metadata m1 on (dbo.Records.RecordID = m1.RecordID and m1.MetadataName = 'PublishingCaseNumber') LEFT OUTER JOIN
        dbo.Metadata m2 on (dbo.Records.RecordID = m2.RecordID and m2.MetadataName = 'Subject2')
WHERE Records.Deleted = 0 and Records.IsMarkedForDelete = 0 AND Records.RecordType = '3B0F842A-CDAB-420F-88BC-930E259F5782'
GROUP BY CaseTypes.Name, CaseTypes.RecordID
`
const LOGBIRTING_CATEGORY_QUERY = `

SELECT
        l2.ListValue AS Category,
        l2.ListValueID as CategoryID
FROM    dbo.Cases INNER JOIN
        dbo.Records ON dbo.Records.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.Keywords k on k.RecordID = dbo.Cases.RecordID LEFT JOIN
        dbo.ListValues l2 on l2.ListValueID = k.KeywordID LEFT JOIN
        dbo.ListValues l1 ON l1.ListValueID = dbo.Records.StatusID INNER JOIN
        dbo.Records AS Responsibles ON Responsibles.RecordID = dbo.Cases.ResponsibleWorkerID INNER JOIN
        dbo.OrganisationalUnits ON dbo.OrganisationalUnits.OrganisationalUnitID = dbo.Records.OrganisationalUnitID LEFT OUTER JOIN
        dbo.PublicationDates ON dbo.PublicationDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.SignatureDates ON dbo.SignatureDates.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.AdvertUserGroups ON dbo.AdvertUserGroups.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Records AS CaseTypes ON CaseTypes.RecordID = dbo.Cases.CaseTemplateID LEFT OUTER JOIN
        dbo.Records AS Clients ON Clients.RecordID = dbo.Cases.ClientID LEFT OUTER JOIN
        dbo.RecordJournalKeys ON dbo.RecordJournalKeys.RecordID = dbo.Records.RecordID AND dbo.RecordJournalKeys.IsPrimary = 1 LEFT OUTER JOIN
        dbo.Categories ON dbo.Categories.RecordID = dbo.RecordJournalKeys.CategoryID LEFT OUTER JOIN
        dbo.Records AS CaseCategories ON CaseCategories.RecordID = dbo.Cases.CategoryID LEFT OUTER JOIN
        dbo.AdvertHtmlCache ON (dbo.AdvertHtmlCache.PrintingChar = dbo.PublicationDates.PrintingChar)  AND dbo.AdvertHtmlCache.RecordID = dbo.Cases.RecordID LEFT OUTER JOIN
        dbo.Metadata m1 on (dbo.Records.RecordID = m1.RecordID and m1.MetadataName = 'PublishingCaseNumber') LEFT OUTER JOIN
        dbo.Metadata m2 on (dbo.Records.RecordID = m2.RecordID and m2.MetadataName = 'Subject2')
WHERE Records.Deleted = 0 and Records.IsMarkedForDelete = 0 AND Records.RecordType = '3B0F842A-CDAB-420F-88BC-930E259F5782' AND l2.ListValue IS NOT NULL and l1.ListValue = 'Útgefin'
GROUP BY l2.ListValue, l2.ListValueID
`

const ADVERTS_QUERY = (limit = 10, offset = 0) => `
  SELECT
    TOP 1000
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
    where PublicationNumber IS NOT NULL AND PublicationNumber != '' and PublicationDate < '2025-01-01'
  ORDER BY
    [ModifiedDate] ASC


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

const ADVERT_DOCUMENTS_CORRECTIONS_QUERY = (recordId: string) => `
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
	Records.RecordID = '${recordId}' AND Records.Deleted = 0 AND records.ismarkedfordelete = 0`

export async function connect(mssqlConnectionString: string) {
  await mssql.connect(mssqlConnectionString)
}

export async function getSubscribers(): Promise<Array<DbSubscriber>> {
  const subscribers = await mssql.query(SUBSCRIBER_QUERY)
  const records = subscribers.recordset as Array<any>
  const subs: Array<DbSubscriber> = []

  records.forEach((subscriber) => {
    const s = {
      id: subscriber.RecordID,
      username: subscriber.UserName,
      fullName: subscriber.FullName,
      email: subscriber.Email,
      password: subscriber.Password,
      subscriptionValidFrom: subscriber.SubscriptionValidFrom,
      subscriptionValidTo: subscriber.SubscriptionValidTo,
      blocked: subscriber.Blocked,
      freeSubscription: subscriber.FreeSubscription,
      idNumber: subscriber.IDNumber,
      firstName: subscriber.FirstName,
      middleName: subscriber.MiddleName,
      lastName: subscriber.LastName,
      contactName: subscriber.ContactName,
      phoneNumber: subscriber.PhoneNumber,
      streetName: subscriber.StreetName,
      streetNumber: subscriber.StreetNumber,
      postCode: subscriber.PostCode,
      floor: subscriber.Floor,
      city: subscriber.City,
    }
    subs.push(s)
  })
  return subs
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

export async function getCorrections(): Promise<DbCorrections[]> {
  const correctionfromDb = await mssql.query(CORRECTIONS_QUERY)
  const records = correctionfromDb.recordset as Array<any>
  const corrections: Array<DbCorrections> = []

  records.forEach((correction) => {
    const c = {
      id: correction.RecordID,
      value: correction.MetadataValue,
    }
    corrections.push(c)
  })
  return corrections
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
      category: advert.Category,
      category_id: advert.CategoryID,
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

export async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = []
  let current = 0

  async function next(): Promise<void> {
    if (current >= items.length) return
    const idx = current++
    results[idx] = await mapper(items[idx], idx)
    await next()
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(0)
    .map(() => next())
  await Promise.all(workers)
  return results
}

export async function getAdvertDocuments(
  adverts: DbAdverts,
): Promise<Array<DbAdvert>> {
  const advertsWithFileUrl = await Promise.all(
    adverts.adverts.map(async (item) => {
      //const documentFromDB = await mssql.query(ADVERT_DOCUMENTS_QUERY(item.id))

      //const url = `${cdnUrl}/${key}`
      const url = await savePDF(
        null,
        item.serial_number,
        new Date(item.publication_year).getFullYear(),
        item.department_id,
      )

      if (url) {
        item.document_pdf_url = url
      }
      return item
    }),
  )
  return advertsWithFileUrl
}

export async function getAdvertDocumentsCorrections(
  corrections: Array<Correction>,
) {
  const correctionsWithDocumentUrl: Array<Correction> = []
  for (const item of corrections) {
    if (!item.documentId) {
      correctionsWithDocumentUrl.push(item)
    } else {
      const documentFromDB = await mssql.query(
        ADVERT_DOCUMENTS_CORRECTIONS_QUERY(item.documentId.toLocaleLowerCase()),
      )
      if (!documentFromDB.recordset[0]) {
        correctionsWithDocumentUrl.push(item)
      } else {
        const cdnUrl = process.env.ADVERTS_CDN_URL
        item.documentUrl = `${cdnUrl}/${documentFromDB.recordset[0].FileName}`
        correctionsWithDocumentUrl.push(item)
      }
    }
  }

  return correctionsWithDocumentUrl
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

export async function savePDF(
  document: Document | null,
  serial: number,
  year: number,
  departmentId: string,
) {
  /* const client = new S3Client({
    region: 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
    },
  })
  if (!client) {
    throw new Error('S3 client not initialized')
  }*/

  let departmentLetter
  switch (departmentId.toLocaleLowerCase()) {
    case '69cd3e90-106e-4b9c-8419-148c29e1738a':
      departmentLetter = `A`
      break
    case '637291f2-f7f4-405d-8586-ef88b59cab00':
      departmentLetter = `B`
      break
    case '472af28c-5f60-48b4-81f5-4bb4254dd74d':
      departmentLetter = `C`
      break
    case 'aa408eae-a76a-4ed8-9aa3-388dc0c8ff05':
      departmentLetter = `tolublod`
      break
  }

  const bucket = process.env.ADVERTS_BUCKET
  const cdnUrl = process.env.ADVERTS_CDN_URL
  const key = `${departmentLetter}_nr_${serial}_${year}.pdf`
  return `${cdnUrl}/${key}`
}

export async function getLogbirtingAdverts(): Promise<Array<LogbirtingAdvert>> {
  const advertsFromDb = await mssql.query(LOGBIRTING_QUERY)

  const records = advertsFromDb.recordset as Array<any>
  const adverts: Array<LogbirtingAdvert> = []

  records.forEach((advert) => {
    const a: LogbirtingAdvert = {
      legacy_id: advert.RecordID,
      category_id: advert.CategoryID,
      html: advert.Body,
      publication_number: advert.PublicationNumber,
      responsible_name: advert.ResponsibleName,
      title: advert.Name,
      type_id: advert.TypeID,
      created_at: advert.PublicationDate,
      updated_at: advert.PublicationDate,
      advert_status: 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
      ssn: advert.SSN,
      version:
        advert.PrintingChar === 'A'
          ? 1
          : advert.PrintingChar === 'B'
            ? 2
            : advert.PrintingChar === 'C'
              ? 3
              : 1,
    }
    adverts.push(a)
  })

  return adverts
}

export async function getLogbirtingTypes() {
  const typesFromDb = await mssql.query(LOGBIRTING_TYPE_QUERY)
  const records = typesFromDb.recordset as Array<any>
  const types: Array<LBType> = []

  records.forEach((type) => {
    const t = {
      typeName: type.TypeName,
      typeId: type.TypeId,
    }
    types.push(t)
  })
  return types
}

export async function getLogbirtingCategories(): Promise<LBCategory[]> {
  const categoriesFromDb = await mssql.query(LOGBIRTING_CATEGORY_QUERY)
  const records = categoriesFromDb.recordset as Array<any>
  const categories: Array<LBCategory> = []

  records.forEach((category) => {
    const c = {
      categoryId: category.Category,
      categoryName: category.CategoryID,
    }
    categories.push(c)
  })
  return categories
}

export async function getLogbirtingTypesAndCategories(): Promise<
  CategoryAndType[]
> {
  const categoriesFromDb = await mssql.query(LOGBIRTING_TYPE_AND_CATEGORY_QUERY)
  const records = categoriesFromDb.recordset as Array<any>
  const categories: Array<CategoryAndType> = []

  records.forEach((category) => {
    const c: CategoryAndType = {
      categoryId: category.CategoryID,
      typeId: category.TypeId,
      categoryName: category.Category,
      typeName: category.TypeName,
    }
    categories.push(c)
  })
  return categories
}
