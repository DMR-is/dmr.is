import fetch from 'node-fetch'
import { QueryTypes } from 'sequelize'

import type {
  CurrentRegulationChange,
  HTMLText,
  ISODate,
  PlainText,
  RegName,
  SkippedRegulationChange,
} from '../routes/types'
import { db } from '../utils/sequelize'
import { getRegulationById, getRegulationChanges } from './Regulation'

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION_NAME || 'eu-west-1',
})

export type ChangeSuggestionStatus =
  | 'pending'
  | 'applied'
  | 'rejected'
  | 'superseded'

/** Confidence band, in Icelandic as sent by the suggestion process. */
export type ChangeSuggestionReportBand = 'hátt' | 'miðlungs' | 'lágt'

export type ChangeSuggestionReportChange = {
  band: ChangeSuggestionReportBand
  amendingArticle?: string
  instructionExcerpt?: string
  [key: string]: unknown
}

export type ChangeSuggestionReportMissingChange = {
  changingName: RegName
  /** `regulationchange` id */
  changeId: number
  date: ISODate
}

/**
 * Report produced by the change suggestion process, stored as-is in the
 * `report` jsonb column. Fields without a value are omitted, and when the
 * report could not be built only the counts and `error` are present — so
 * everything but the counts is optional. Not validated beyond being an object,
 * so a new `version` on their side does not start failing here.
 */
export type ChangeSuggestionReport = {
  version?: number
  baseRegulation?: string
  amendingRegulation?: string
  appliedCount: number
  skippedCount: number
  minConfidence?: number
  changes?: ChangeSuggestionReportChange[]
  skippedInstructions?: unknown[]
  /**
   * Version 2. Earlier changes the base text is missing, taken from
   * `skippedChanges`; present only when that list is not empty.
   */
  missingEarlierChanges?: ChangeSuggestionReportMissingChange[]
  error?: string
}

const toJsonbSafe = (value: string) => value.replace(/\0/g, '').toWellFormed()

/**
 * jsonb refuses `\u0000` and unpaired surrogates, both of which JSON.stringify
 * emits as escapes. Either would fail the whole INSERT and lose the suggestion
 * along with its report, so drop NULs and replace lone surrogates with U+FFFD,
 * in object keys as well as string values. NULs go first, so a pair split by a
 * NUL rejoins instead of becoming two U+FFFD.
 */
export const serialiseReport = (report: ChangeSuggestionReport): string =>
  JSON.stringify(report, (_key, value) => {
    if (typeof value === 'string') {
      return toJsonbSafe(value)
    }
    // A replacer never sees keys, so rebuild plain objects with cleaned ones.
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [toJsonbSafe(k), v]),
      )
    }
    return value
  })

export type ChangeSuggestion = {
  id: number
  regulationId: number
  changingId: number
  title: PlainText
  text: HTMLText
  changeset: string | null
  report: ChangeSuggestionReport | null
  status: ChangeSuggestionStatus
  appliedChangeId: number | null
  createdAt: Date
  decidedBy: string | null
  decidedAt: Date | null
}

export type ChangeSuggestionCreateInput = {
  regulationId: number
  changingId: number
  title: PlainText
  text: HTMLText
  changeset?: string | null
  report?: ChangeSuggestionReport | null
  status?: ChangeSuggestionStatus
  filekey?: string
}

export type ChangeSuggestionUpdateInput = {
  title?: PlainText
  text?: HTMLText
  changeset?: string | null
  status?: ChangeSuggestionStatus
  appliedChangeId?: number | null
  decidedBy?: string | null
  decidedAt?: Date | null
}

export type ChangeSuggestionFilters = {
  regulationId?: number
  changingId?: number
  status?: ChangeSuggestionStatus | ChangeSuggestionStatus[]
  page?: number
  limit?: number
}

export type PaginatedChangeSuggestions = {
  data: ChangeSuggestion[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Get all change suggestions with optional filters
 */
export async function getAllChangeSuggestions(
  filters?: ChangeSuggestionFilters,
): Promise<PaginatedChangeSuggestions> {
  let whereClause = 'WHERE 1=1'
  const replacements: Record<string, any> = {}

  if (filters?.regulationId) {
    whereClause += ' AND "regulationId" = :regulationId'
    replacements.regulationId = filters.regulationId
  }

  if (filters?.changingId) {
    whereClause += ' AND "changingId" = :changingId'
    replacements.changingId = filters.changingId
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      whereClause += ' AND status = ANY(:status)'
      replacements.status = filters.status
    } else {
      whereClause += ' AND status = :status'
      replacements.status = filters.status
    }
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as count
    FROM "regulationchangesuggestion"
    ${whereClause}
  `

  const countResult = await db.query<{ count: string }>(countQuery, {
    replacements,
    type: QueryTypes.SELECT,
  })

  const total = parseInt(countResult[0]?.count || '0', 10)

  // Pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 20
  const offset = (page - 1) * limit

  replacements.limit = limit
  replacements.offset = offset

  // Get paginated data
  const query = `
    SELECT *
    FROM "regulationchangesuggestion"
    ${whereClause}
    ORDER BY "createdAt" DESC
    LIMIT :limit OFFSET :offset
  `

  const suggestions = await db.query<ChangeSuggestion>(query, {
    replacements,
    type: QueryTypes.SELECT,
  })

  return {
    data: suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get a single change suggestion by ID
 */
export async function getChangeSuggestion(
  id: number,
): Promise<ChangeSuggestion | undefined> {
  const query = `
    SELECT *
    FROM "regulationchangesuggestion"
    WHERE id = :id
    LIMIT 1
  `

  const suggestions = await db.query<ChangeSuggestion>(query, {
    replacements: { id },
    type: QueryTypes.SELECT,
  })

  return suggestions[0]
}

/**
 * Create a new change suggestion
 */
export async function createChangeSuggestion(
  data: ChangeSuggestionCreateInput,
): Promise<ChangeSuggestion> {
  let textContent: HTMLText = data.text

  // If a filekey is provided, use the file, otherwise use the provided text
  if (data.filekey) {
    const bucketName = process.env.UI_PATH_FILES_BUCKET

    if (!bucketName) {
      throw new Error('UI_PATH_FILES_BUCKET environment variable is not set')
    }

    try {
      const s3Object = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: data.filekey,
        }),
      )

      if (!s3Object.Body) {
        throw new Error(`File not found in S3: ${data.filekey}`)
      }

      // v2 handed back a Buffer here; v3 streams, so the read is explicit.
      textContent = (await s3Object.Body.transformToString('utf-8')) as HTMLText
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch file from S3: ${errorMessage}`)
    }
  }

  const query = `
    INSERT INTO "regulationchangesuggestion" 
      ("regulationId", "changingId", title, text, changeset, report, status, "appliedChangeId", "decidedBy", "decidedAt", "createdAt")
    VALUES 
      (:regulationId, :changingId, :title, :text, :changeset, CAST(:report AS jsonb), :status, NULL, NULL, NULL, NOW())
    RETURNING *
  `

  const results = await db.query<ChangeSuggestion>(query, {
    replacements: {
      regulationId: data.regulationId,
      changingId: data.changingId,
      title: data.title,
      text: textContent, // Use fetched content or original text
      changeset: data.changeset ?? null,
      // Sequelize does not serialise a plain object as JSON in a raw query.
      report: data.report ? serialiseReport(data.report) : null,
      status: data.status ?? 'pending',
    },
    type: QueryTypes.SELECT,
  })

  if (!results[0]) {
    throw new Error('Failed to create ChangeSuggestion')
  }

  return results[0]
}

/**
 * Update an existing change suggestion
 */
export async function updateChangeSuggestion(
  id: number,
  data: ChangeSuggestionUpdateInput,
): Promise<ChangeSuggestion> {
  const updateFields: string[] = []
  const replacements: Record<string, any> = { id }

  if (data.title !== undefined) {
    updateFields.push('title = :title')
    replacements.title = data.title
  }

  if (data.text !== undefined) {
    updateFields.push('text = :text')
    replacements.text = data.text
  }

  if (data.changeset !== undefined) {
    updateFields.push('changeset = :changeset')
    replacements.changeset = data.changeset
  }

  if (data.status !== undefined) {
    updateFields.push('status = :status')
    replacements.status = data.status
  }

  if (data.appliedChangeId !== undefined) {
    updateFields.push('"appliedChangeId" = :appliedChangeId')
    replacements.appliedChangeId = data.appliedChangeId
  }

  if (data.decidedBy !== undefined) {
    updateFields.push('"decidedBy" = :decidedBy')
    replacements.decidedBy = data.decidedBy
  }

  if (data.decidedAt !== undefined) {
    updateFields.push('"decidedAt" = :decidedAt')
    replacements.decidedAt = data.decidedAt
  }

  if (updateFields.length === 0) {
    // No fields to update, just return the existing record
    const existing = await getChangeSuggestion(id)
    if (!existing) {
      throw new Error(`ChangeSuggestion with id ${id} not found`)
    }
    return existing
  }

  const query = `
    UPDATE "regulationchangesuggestion"
    SET ${updateFields.join(', ')}
    WHERE id = :id
    RETURNING *
  `

  const results = await db.query<ChangeSuggestion>(query, {
    replacements,
    type: QueryTypes.SELECT,
  })

  if (!results || results.length === 0) {
    throw new Error(`ChangeSuggestion with id ${id} not found`)
  }

  const updated = results[0] as ChangeSuggestion
  if (!updated) {
    throw new Error(`ChangeSuggestion with id ${id} not found`)
  }

  return updated
}

/**
 * Delete a change suggestion
 */
export async function deleteChangeSuggestion(
  id: number,
): Promise<{ success: true; id: number }> {
  const query = `
    DELETE FROM "regulationchangesuggestion"
    WHERE id = :id
    RETURNING id
  `

  const results = await db.query<{ id: number }>(query, {
    replacements: { id },
    type: QueryTypes.SELECT,
  })

  if (!results || results.length === 0 || !results?.[0]?.id) {
    throw new Error(`ChangeSuggestion with id ${id} not found`)
  }

  return { success: true, id: results[0].id }
}

/**
 * The base regulation's text as it stands just before the changing regulation
 * takes effect: the newest `regulationchange` row dated before the pair's own
 * row that carries a consolidated text, else the original `regulation.text`.
 *
 * The pair's own row is skipped even when it has text, since that is the text
 * *after* the change — a suggestion built on it would apply the change twice,
 * and one built on anything older would drop the changes in between.
 * `skippedChanges` lists the earlier changes that text is missing because
 * their rows have no consolidated text.
 *
 * A pair with no row yet is a change not registered on the base, so every
 * existing row counts as earlier: the walk starts from the newest and `date`
 * is left out. The robot in prod halts on any error, so this stays a 200.
 */
export async function getChangeHistoryCurrent(
  baseRegId: number,
  changingRegId: number,
): Promise<CurrentRegulationChange> {
  if (!baseRegId || !changingRegId) {
    throw new Error('Invalid regulation ids provided')
  }

  const baseRegulation = await getRegulationById(baseRegId)

  if (!baseRegulation) {
    throw new Error(`Base regulation not found: ${baseRegId}`)
  }

  // Newest first: date, then publishedDate, then id, all descending.
  const history = await getRegulationChanges(baseRegulation.id)

  // A changing regulation can have several rows on one base (parts taking
  // effect on different dates); "before the change" is before the oldest.
  // -1 when the pair has no row, which makes the walk below start at 0.
  const ownIndex = history.findLastIndex(
    ({ changingid }) => changingid === changingRegId,
  )

  const ownChange = history[ownIndex]

  // Walk back from the change to the newest version with text. Textless rows
  // passed on the way are changes that text is missing; anything older is
  // already in it.
  const skippedChanges: Array<SkippedRegulationChange> = []
  let previous: (typeof history)[number] | undefined

  for (const change of history.slice(ownIndex + 1)) {
    if (change.changingid === changingRegId) {
      continue
    }
    if (change.text) {
      previous = change
      break
    }
    skippedChanges.push({
      id: change.id,
      changingId: change.changingid,
      changingName: change.changingName,
      date: change.date,
    })
  }

  return {
    date: ownChange?.date ?? undefined,
    currentTitle: previous?.title || baseRegulation.title,
    currentText: previous?.text ?? baseRegulation.text,
    sourceChangeId: previous?.id ?? null,
    sourceChangingName: previous?.changingName ?? null,
    sourceDate: previous?.date ?? undefined,
    skippedChanges,
  }
}

/**
 * Start change suggestion process
 */
export async function startChangeSuggestionProcess({
  baseRegulationName,
  amendingRegulationName,
}: {
  baseRegulationName: RegName
  amendingRegulationName: RegName
}): Promise<{ success: true }> {
  const externalUrl = process.env.REGULATION_CHANGE_SUGGESTION_URL

  if (!externalUrl) {
    throw new Error(
      'REGULATION_CHANGE_SUGGESTION_URL environment variable is not set',
    )
  }

  if (!baseRegulationName || !amendingRegulationName) {
    throw new Error(
      `Invalid regulation names provided: has base ${!!baseRegulationName}, has amending ${!!amendingRegulationName}`,
    )
  }

  const response = await fetch(externalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base_regulation_name: baseRegulationName,
      amending_regulation_name: amendingRegulationName,
    }),
  })

  if (!response.ok) {
    let errorDetails = ''
    try {
      const errorBody = await response.text()
      errorDetails = errorBody ? `: ${errorBody}` : ''
    } catch {
      // If we can't read the body, just use status ...
    }

    throw new Error(
      `Failed to start change suggestion process: ${response.status} ${response.statusText}${errorDetails}`,
    )
  }

  return { success: true }
}
