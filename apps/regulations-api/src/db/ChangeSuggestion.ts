import S3 from 'aws-sdk/clients/s3'
import fetch from 'node-fetch'
import { QueryTypes } from 'sequelize'

import type {
  CurrentRegulationChange,
  HTMLText,
  PlainText,
  RegName,
} from '../routes/types'
import { removeHistoryAfterRegId } from '../utils/misc'
import { db } from '../utils/sequelize'
import { getRegulationById, getRegulationChanges } from './Regulation'

const s3 = new S3({
  region: process.env.AWS_REGION_NAME || 'eu-west-1',
})

export type ChangeSuggestionStatus =
  | 'pending'
  | 'applied'
  | 'rejected'
  | 'superseded'

export type ChangeSuggestion = {
  id: number
  regulationId: number
  changingId: number
  title: PlainText
  text: HTMLText
  changeset: string | null
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
      const s3Object = await s3
        .getObject({
          Bucket: bucketName,
          Key: data.filekey,
        })
        .promise()

      if (!s3Object.Body) {
        throw new Error(`File not found in S3: ${data.filekey}`)
      }

      textContent = s3Object.Body.toString('utf-8') as HTMLText
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to fetch file from S3: ${errorMessage}`)
    }
  }

  const query = `
    INSERT INTO "regulationchangesuggestion" 
      ("regulationId", "changingId", title, text, changeset, status, "appliedChangeId", "decidedBy", "decidedAt", "createdAt")
    VALUES 
      (:regulationId, :changingId, :title, :text, :changeset, :status, NULL, NULL, NULL, NOW())
    RETURNING *
  `

  const results = await db.query<ChangeSuggestion>(query, {
    replacements: {
      regulationId: data.regulationId,
      changingId: data.changingId,
      title: data.title,
      text: textContent, // Use fetched content or original text
      changeset: data.changeset ?? null,
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
 * Get change history current change
 */
export async function getChangeHistoryCurrent(
  baseRegId: number,
  changingRegId: number,
): Promise<CurrentRegulationChange> {
  if (!baseRegId || !changingRegId) {
    throw new Error('Invalid regulation ids provided')
  }

  const baseRegulation = await getRegulationById(baseRegId)
  const taskBase = baseRegulation

  if (!taskBase) {
    throw new Error(`Base regulation not found: ${baseRegId}`)
  }

  const changeHistory = await getRegulationChanges(taskBase.id)
  const changes =
    changeHistory &&
    changeHistory.filter(({ changingid }) => changingid === changingRegId)
  const _changes = changes.slice(0)
  const _lastChange = changes[_changes.length - 1]

  const changeHistoryAfterRegId = removeHistoryAfterRegId(
    changeHistory,
    changingRegId,
  )

  if (changeHistoryAfterRegId.length < 1) {
    throw new Error(
      `Not enough change history for regulation id: ${changingRegId}`,
    )
  }
  const baseSource =
    changeHistoryAfterRegId[1] && changeHistoryAfterRegId[1].text
      ? changeHistoryAfterRegId[1]
      : taskBase
  const textSource = changeHistoryAfterRegId[0]?.text
    ? changeHistoryAfterRegId[0]
    : baseSource

  const currentChange: CurrentRegulationChange = {
    date: _lastChange?.date ?? undefined,
    currentTitle: textSource.title,
    currentText: textSource.text,
  }
  return currentChange
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
}): Promise<any> {
  const externalUrl = process.env.REGULATION_CHANGE_SUGGESTION_URL

  if (!externalUrl) {
    throw new Error(
      'REGULATION_CHANGE_SUGGESTION_URL environment variable is not set',
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
    throw new Error(
      `Failed to start change suggestion process: ${response.status} ${response.statusText}`,
    )
  }

  return await response.json()
}
