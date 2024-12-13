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
  DbDepartment,
  DbType,
  DbCategory,
  DbAdverts,
  DbAdvert,
  DbStatus,
  DbInvolvedParty,
  AdvertCategory,
  DbDocuments,
  Document,
  MainType,
  DbMainType,
} from '../types'
import { slugit } from './slug'

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

export async function getMainTypes(
  departments: Array<DbDepartment>,
): Promise<Array<MainType>> {
  const mainTypes = [
    {
      id: 'e448ed42-df5e-4eba-824b-c11a7d144281',
      title: 'FORSETAÚRSKURÐUR',
      slug: 'a-deild-forsetaurskurdur',
    },
    {
      id: 'e5c4c23c-7da2-4a21-8688-f1a50842605a',
      title: 'AUGLÝSING',
      slug: 'a-deild-auglysing',
    },
    {
      id: 'e595541e-44f2-487d-8726-e78cf1f8cea2',
      title: 'FORSETABRÉF',
      slug: 'a-deild-forsetabref',
    },
    {
      id: '7703e365-894d-4b3c-bcd6-e8550025d7b9',
      title: 'REGLUGERÐ',
      slug: 'a-deild-reglugerd',
    },
    {
      id: 'ca1c4a13-e1de-4e91-a8c7-94ad70112aba',
      title: 'REGLUR',
      slug: 'a-deild-reglur',
    },
    {
      id: '9dfa19d9-2cfc-46d1-9e0a-230efe13968a',
      title: 'ARÐSKRÁ',
      slug: 'b-deild-ardskra',
    },
    {
      id: '2646ff85-997e-4640-98ef-cfdf263feada',
      title: 'SAMÞYKKT',
      slug: 'b-deild-samthykkt',
    },
    {
      id: 'd63db4fd-8e99-4773-b176-6b9b28d48e13',
      title: 'FYRIRMÆLI',
      slug: 'b-deild-fyrirmaeli',
    },
    {
      id: 'b7576d53-cc3a-47c5-b156-604873690ae5',
      title: 'GJALDSKRÁ',
      slug: 'b-deild-gjaldskra',
    },
    {
      id: '5de250c0-b8c3-438b-82bb-6c1f20d3e8bf',
      title: 'LEIÐBEININGAR',
      slug: 'b-deild-leidbeiningar',
    },
    {
      id: 'cde19be1-430a-4bee-9259-2645c12e71ee',
      title: 'REIKNINGUR',
      slug: 'b-deild-reikningur',
    },
    {
      id: '37360fa4-2296-4154-a007-08a2dc947e64',
      title: 'SKIPULAGSSKRÁ',
      slug: 'b-deild-skipulagsskra',
    },
    {
      id: '8cfbcca0-9f21-477d-8f2a-7d0cf2cc423a',
      title: 'LÖG',
      slug: 'a-deild-log',
    },
    {
      id: '317c862c-925e-4855-82f3-f848a3c9a8ff',
      title: 'AUGLÝSING',
      slug: 'c-deild-auglysing',
    },
    {
      id: 'f0b37828-dd64-4e68-a093-7fe58f7b5d35',
      title: 'REGLUGERÐ',
      slug: 'c-deild-reglugerd',
    },
  ]

  const mapped: MainType[] = []

  mainTypes.forEach((type) => {
    const mainTypeDepartmentSlug = type.slug.split('-').slice(0, 2).join('-')

    const department = departments.find((dep) => {
      const departmentSlug = slugit(dep.title)

      return departmentSlug === mainTypeDepartmentSlug
    })

    if (!department) {
      console.error(
        `Department not found for ${type.title}, when mapping main types`,
      )

      return
    }

    const mt = {
      ...type,
      department_id: department.id,
    }

    mapped.push(mt)
  })

  return mapped
}

export async function getTypes(mainTypes: Array<MainType>) {
  const typesFromDb = await mssql.query(TYPE_QUERY)
  const records = typesFromDb.recordset as Array<any>
  const types: Array<DbType> = []

  records.forEach((type) => {
    const mainType = mainTypes.find((mainType) => {
      return mainType.department_id === type.departmentId
    })

    if (!mainType) {
      console.error(`Main type not found for ${type.name}, when mapping types`)
      return
    }

    const t = {
      main_type_id: mainType.department_id,
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

  const bucket = 'official-journal-application-files-bucket-dev'
  const key = `adverts/${document.FileName}`
  if (!bucket) {
    throw new Error('AWS_BUCKET_NAME not set')
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const fileCheck = await client.send(command)
    //console.log(`File exists: ${key}`)
    //console.log(`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`)
    return `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`
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
    return res.Location
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
