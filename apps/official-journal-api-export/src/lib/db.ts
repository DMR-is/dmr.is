/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mssql from 'mssql'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3'

import {
  AdvertCategory,
  Correction,
  DbAdvert,
  DbAdverts,
  DbCategory,
  DbCorrections,
  DbDepartment,
  DbInvolvedParty,
  DbStatus,
  DbType,
  Document,
} from '../types'

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
): Promise<Array<DbAdvert>> {
  const advertsWithFileUrl = await Promise.all(
    adverts.adverts.map(async (item) => {
      const documentFromDB = await mssql.query(ADVERT_DOCUMENTS_QUERY(item.id))

      //const test = new PdfService();
      const url = await savePDF(documentFromDB.recordset[0])
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

export async function savePDF(document: Document) {
  const client = new S3Client({
    region: 'eu-west-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
    },
  })
  if (!client) {
    throw new Error('S3 client not initialized')
  }

  const bucket = process.env.ADVERTS_BUCKET
  const cdnUrl = process.env.ADVERTS_CDN_URL
  const key = `${document.FileName}`
  if (!bucket) {
    throw new Error('AWS_BUCKET_NAME not set')
  }
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: `adverts/${key}`,
    })

    const fileCheck = await client.send(command)
    //console.log(`File exists: ${key}`)
    //console.log(`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`)
    console.log('found file in s3')
    return `${cdnUrl}/${document.FileName}`
    //https://official-journal-application-files-bucket-dev.s3.eu-west-1.amazonaws.com/adverts/A_nr_1_2006.pdf
  } catch (error: any) {
    console.log(`File does not exist: ${key}, let upload`)
  }

  let uploadId
  const buffer = Buffer.from(document.Stream, 'utf8')
  try {
    const multipartUpload = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: `adverts/${document.FileName}`,
      }),
    )

    uploadId = multipartUpload.UploadId

    const uploadPromises = []
    // Multipart uploads require a minimum size of 5 MB per part.
    const chunkSize = 1024 * 1024 * 5
    const numberOfparts = Math.ceil(buffer.length / chunkSize)

    // Upload each part.
    for (let i = 0; i < numberOfparts; i++) {
      const start = i * chunkSize
      const end = start + chunkSize
      uploadPromises.push(
        client
          .send(
            new UploadPartCommand({
              Bucket: bucket,
              Key: `adverts/${document.FileName}`,
              UploadId: uploadId,
              Body: buffer.subarray(start, end),
              PartNumber: i + 1,
            }),
          )
          .then((d) => {
            return d
          }),
      )
    }

    const uploadResults = await Promise.all(uploadPromises)

    const res = await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: `adverts/${document.FileName}`,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: uploadResults.map(({ ETag }, i) => ({
            ETag,
            PartNumber: i + 1,
          })),
        },
      }),
    )
    return `${cdnUrl}/${document.FileName}`
  } catch (err) {
    console.log('Error uploading parts', err)
    if (uploadId) {
      const res = await client.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: `adverts/${document.FileName}`,
          UploadId: uploadId,
        }),
      )
    }
    return null
  }
}
