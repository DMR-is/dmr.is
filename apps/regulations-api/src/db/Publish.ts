import { QueryTypes, Transaction } from 'sequelize'

import type { ISODate, RegName } from '../routes/types'
import { db } from '../utils/sequelize'

// ---------------------------------------------------------------------------

export type PublishRegulationInput = {
  name: string
  title: string
  text: string
  signatureDate: string
  publishedDate: string
  effectiveDate: string
  type: 'base' | 'amending'
  ministryName?: string
  lawChapterSlugs?: string[]
  impacts?: Array<{
    type: 'amend' | 'repeal'
    regulation: string
    date: string
    title?: string
    text?: string
    diff?: string
  }>
}

// ---------------------------------------------------------------------------

async function getRegulationIdByName(
  name: string,
  transaction: Transaction,
): Promise<number | undefined> {
  const results = await db.query<{ id: number }>(
    `SELECT id FROM regulation WHERE name = :name LIMIT 1`,
    { replacements: { name }, type: QueryTypes.SELECT, transaction },
  )
  return results[0]?.id
}

async function getMinistryIdByName(
  name: string,
  transaction: Transaction,
): Promise<number | undefined> {
  const results = await db.query<{ id: number }>(
    `SELECT id FROM ministry WHERE name = :name LIMIT 1`,
    { replacements: { name }, type: QueryTypes.SELECT, transaction },
  )
  return results[0]?.id
}

async function getLawChapterIdBySlug(
  slug: string,
  transaction: Transaction,
): Promise<number | undefined> {
  const results = await db.query<{ id: number }>(
    `SELECT id FROM lawchapter WHERE slug = :slug LIMIT 1`,
    { replacements: { slug }, type: QueryTypes.SELECT, transaction },
  )
  return results[0]?.id
}

/**
 * Mark tasks as not-done for impacted base regulation IDs.
 * This signals that a human editor needs to review the changes.
 */
async function setTasksDoneStatus(
  regulationIds: number[],
  transaction: Transaction,
): Promise<void> {
  if (regulationIds.length === 0) return

  await db.query(
    `UPDATE task SET done = false, lastedited = NOW() WHERE regulationid = ANY(:regulationIds)`,
    { replacements: { regulationIds }, type: QueryTypes.UPDATE, transaction },
  )
}

// ---------------------------------------------------------------------------

/**
 * Publish a regulation directly to the regulation database.
 * Follows the same transactional pattern as `insertUpdates` in reglugerd-admin-www.
 */
export async function publishRegulation(
  input: PublishRegulationInput,
): Promise<{ regulationId: number }> {
  const transaction = await db.transaction()

  try {
    // 1. Check if regulation already exists
    const existingId = await getRegulationIdByName(input.name, transaction)
    if (existingId) {
      throw new Error(`Regulation with name ${input.name} already exists`)
    }

    // 2. Resolve ministry ID
    let ministryId: number | undefined
    if (input.ministryName) {
      ministryId = await getMinistryIdByName(input.ministryName, transaction)
    }

    // 3. INSERT regulation
    const insertResult = await db.query<{ id: number }>(
      `INSERT INTO regulation (name, title, text, signaturedate, publisheddate, effectivedate, type, status, ministryid, originaldoc, repealedbeacusereasons)
       VALUES (:name, :title, :text, :signatureDate, :publishedDate, :effectiveDate, :type, 'text_locked', :ministryId, NULL, 0)
       RETURNING id`,
      {
        replacements: {
          name: input.name,
          title: input.title,
          text: input.text,
          signatureDate: input.signatureDate,
          publishedDate: input.publishedDate,
          effectiveDate: input.effectiveDate,
          type: input.type,
          ministryId: ministryId ?? null,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    const newRegulationId = insertResult[0]?.id
    if (!newRegulationId) {
      throw new Error('Failed to insert regulation - no ID returned')
    }

    // Track impacted base regulation IDs for task status update
    const impactedBaseRegIds: number[] = []

    // 4. Process impacts
    if (input.impacts?.length) {
      for (const impact of input.impacts) {
        const targetRegId = await getRegulationIdByName(
          impact.regulation,
          transaction,
        )

        if (!targetRegId) {
          throw new Error(
            `Target regulation ${impact.regulation} not found for ${impact.type} impact`,
          )
        }

        impactedBaseRegIds.push(targetRegId)

        if (impact.type === 'repeal') {
          // Check for duplicate cancel
          const existingCancel = await db.query<{ id: number }>(
            `SELECT id FROM regulationcancel WHERE changingid = :changingId AND regulationid = :regulationId LIMIT 1`,
            {
              replacements: {
                changingId: newRegulationId,
                regulationId: targetRegId,
              },
              type: QueryTypes.SELECT,
              transaction,
            },
          )

          if (!existingCancel[0]) {
            await db.query(
              `INSERT INTO regulationcancel (changingid, regulationid, date)
               VALUES (:changingId, :regulationId, :date)`,
              {
                replacements: {
                  changingId: newRegulationId,
                  regulationId: targetRegId,
                  date: impact.date,
                },
                type: QueryTypes.INSERT,
                transaction,
              },
            )
          }
        } else if (impact.type === 'amend') {
          await db.query(
            `INSERT INTO regulationchange (changingid, regulationid, date, title, text, changeset)
             VALUES (:changingId, :regulationId, :date, :title, :text, :changeset)`,
            {
              replacements: {
                changingId: newRegulationId,
                regulationId: targetRegId,
                date: impact.date,
                title: impact.title ?? '',
                text: impact.text ?? '',
                changeset: impact.diff ?? '',
              },
              type: QueryTypes.INSERT,
              transaction,
            },
          )
        }
      }
    }

    // 5. Process law chapters
    if (input.lawChapterSlugs?.length) {
      for (const slug of input.lawChapterSlugs) {
        const chapterId = await getLawChapterIdBySlug(slug, transaction)
        if (chapterId) {
          await db.query(
            `INSERT INTO regulation_lawchapter (regulationid, chapterid)
             VALUES (:regulationId, :chapterId)`,
            {
              replacements: {
                regulationId: newRegulationId,
                chapterId,
              },
              type: QueryTypes.INSERT,
              transaction,
            },
          )
        }
      }
    }

    // 6. If base regulation, create a task entry
    if (input.type === 'base') {
      await db.query(
        `INSERT INTO task (regulationid, done, lastedited, migrated)
         VALUES (:regulationId, false, :lastEdited, false)`,
        {
          replacements: {
            regulationId: newRegulationId,
            lastEdited: input.publishedDate,
          },
          type: QueryTypes.INSERT,
          transaction,
        },
      )
    }

    // 7. Set tasks as not-done for all impacted base regulations
    await setTasksDoneStatus(impactedBaseRegIds, transaction)

    await transaction.commit()

    return { regulationId: newRegulationId }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

// ---------------------------------------------------------------------------

/**
 * Check if a base regulation has pending (undone) tasks.
 */
export async function hasPendingTasks(
  regulationName: string,
): Promise<{ hasPendingTasks: boolean }> {
  const regResult = await db.query<{ id: number }>(
    `SELECT id FROM regulation WHERE name = :name LIMIT 1`,
    { replacements: { name: regulationName }, type: QueryTypes.SELECT },
  )

  const regulationId = regResult[0]?.id
  if (!regulationId) {
    return { hasPendingTasks: false }
  }

  const taskResult = await db.query<{ id: number }>(
    `SELECT id FROM task WHERE done = false AND regulationid = :regulationId LIMIT 1`,
    { replacements: { regulationId }, type: QueryTypes.SELECT },
  )

  return { hasPendingTasks: taskResult.length > 0 }
}
