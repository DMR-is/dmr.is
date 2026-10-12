import { QueryTypes, Transaction } from 'sequelize'

import { cleanTitle } from '@dmr.is/regulations-tools/cleanTitle'
import { cleanupAndCombineEditorOutputs } from '@dmr.is/regulations-tools/cleanupEditorOutput'
import type {
  HTMLText,
  PlainText,
  RegName,
} from '@dmr.is/regulations-tools/types'
import { ensureRegName } from '@dmr.is/regulations-tools/utils'

import { createPatch } from '../utils/createPatch'
import { replaceImageUrls } from '../utils/replaceImageUrls'
import { db } from '../utils/sequelize'

// ---------------------------------------------------------------------------

/** A publish request the caller has to fix; the route answers it with 400. */
export class PublishInputError extends Error {}

export type PublishAppendix = { title: string; text: string }

/**
 * A text as the editor holds it: the main text, its appendixes and comments,
 * kept apart. They are combined into the single stored HTML blob here, the
 * same way reglugerd-admin-www combines them, so readers that split the blob
 * with `extractAppendixesAndComments` get the parts back.
 */
type TextParts = {
  text: string
  appendixes?: PublishAppendix[]
  comments?: string
}

export type PublishRegulationInput = TextParts & {
  name: string
  title: string
  signatureDate: string
  publishedDate: string
  effectiveDate: string
  type: 'base' | 'amending'
  ministryName?: string
  lawChapterSlugs?: string[]
  impacts?: Array<
    Partial<TextParts> & {
      type: 'amend' | 'repeal'
      regulation: string
      date: string
      title?: string
    }
  >
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
 * The text an amend impact changes from: the latest finished change to the
 * regulation, or its original text when it has none.
 *
 * Same query as `previousImpactResult` in reglugerd-admin-www, so changesets
 * written here are diffed against the same base text as those written there.
 */
async function getPreviousRegulationText(
  regulationId: number,
  transaction: Transaction,
): Promise<string> {
  const results = await db.query<{ text: string }>(
    `(
       SELECT ch.date, ch.text, ch.regulationid, r.publisheddate
       FROM regulationchange AS ch
       JOIN regulation AS r ON r.id = ch.changingid
       WHERE ch.regulationid = :regulationId AND ch.text != ''
     )
     UNION ALL
     (
       SELECT publisheddate AS date, text, id AS regulationid, publisheddate
       FROM regulation
       WHERE id = :regulationId
     )
     ORDER BY date DESC, publisheddate DESC, regulationid DESC
     LIMIT 1`,
    { replacements: { regulationId }, type: QueryTypes.SELECT, transaction },
  )
  return results[0]?.text ?? ''
}

/**
 * Prepares a text for storing the way reglugerd-admin-www does for a
 * text_locked regulation and for a change: combines the text with its
 * appendixes and comments and cleans the editor output, then moves the files
 * it links to onto the file server under the publishing regulation's name.
 *
 * The file uploads start here, before the transaction commits, and are not
 * awaited. A publish that later rolls back leaves its uploaded files behind; a
 * retry writes the same keys, so they are overwritten rather than duplicated.
 */
const prepareText = (parts: TextParts, regName: RegName): HTMLText => {
  const cleaned = cleanupAndCombineEditorOutputs(
    parts.text as HTMLText,
    parts.appendixes?.map(({ title, text }) => ({
      title: title as PlainText,
      text: text as HTMLText,
    })),
    parts.comments as HTMLText | undefined,
  )
  return replaceImageUrls(cleaned, regName)
}

/**
 * The route has no body schema, so the parts that end up inside the stored
 * text are checked here. A wrong shape would otherwise be dropped or throw deep
 * inside the cleanup.
 */
const assertTextParts = (parts: Partial<TextParts>, where: string): void => {
  const { appendixes, comments } = parts
  if (
    appendixes !== undefined &&
    !(
      Array.isArray(appendixes) &&
      appendixes.every(
        (a) =>
          !!a &&
          typeof a === 'object' &&
          typeof a.title === 'string' &&
          typeof a.text === 'string',
      )
    )
  ) {
    throw new PublishInputError(
      `Invalid appendixes for ${where}: expected an array of { title, text }`,
    )
  }
  if (comments !== undefined && typeof comments !== 'string') {
    throw new PublishInputError(
      `Invalid comments for ${where}: expected a string`,
    )
  }
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
  // `ensureRegName` also normalises ('1/2020' -> '0001/2020'), but the name is
  // stored and looked up as given, and files move under the normalised one.
  // Accept only names that are already canonical so the three agree.
  const regName = ensureRegName(input.name)
  if (!regName || regName !== input.name) {
    throw new PublishInputError(`Invalid regulation name ${input.name}`)
  }
  assertTextParts(input, input.name)
  input.impacts?.forEach((impact) =>
    assertTextParts(impact, `impact on ${impact.regulation}`),
  )

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
          text: prepareText(input, regName),
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
          // An empty text marks an unfinished change, as in reglugerd-admin-www
          const text = impact.text
            ? prepareText(
                {
                  text: impact.text,
                  appendixes: impact.appendixes,
                  comments: impact.comments,
                },
                regName,
              )
            : ''
          const changeset = text
            ? await createPatch(
                targetRegId,
                await getPreviousRegulationText(targetRegId, transaction),
                text,
              )
            : ''

          await db.query(
            `INSERT INTO regulationchange (changingid, regulationid, date, title, text, changeset)
             VALUES (:changingId, :regulationId, :date, :title, :text, :changeset)`,
            {
              replacements: {
                changingId: newRegulationId,
                regulationId: targetRegId,
                date: impact.date,
                title: impact.title ? cleanTitle(impact.title) : '',
                text,
                changeset,
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
