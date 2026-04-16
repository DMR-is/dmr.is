import { RegulationDraft } from '@dmr.is/shared-dto'

export type RegulationPublishPayload = {
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

/**
 * Concatenate the main regulation text with appendixes.
 * The regulation DB stores everything as a single HTML blob.
 */
function buildFullText(draft: RegulationDraft): string {
  let fullText = draft.text

  if (draft.appendixes?.length) {
    for (const appendix of draft.appendixes) {
      fullText += `<h2>${appendix.title}</h2>${appendix.text}`
    }
  }

  return fullText
}

/**
 * Transform a RegulationDraft (from regulations-admin API) into the payload
 * expected by the regulations-api publish endpoint.
 */
export function convertDraftToPublishPayload(
  draft: RegulationDraft,
  publishedDate: Date,
): RegulationPublishPayload {
  const payload: RegulationPublishPayload = {
    name: draft.name ?? '',
    title: draft.title,
    text: buildFullText(draft),
    signatureDate: draft.signatureDate ?? '',
    publishedDate: publishedDate.toISOString().split('T')[0],
    effectiveDate: draft.effectiveDate ?? '',
    type: draft.type as 'base' | 'amending',
    ministryName: draft.ministry,
    lawChapterSlugs: draft.lawChapters?.map((lc) => lc.slug),
  }

  if (draft.impacts?.length) {
    payload.impacts = draft.impacts
      .filter((i) => !i.dropped)
      .map((impact) => ({
        type: impact.type as 'amend' | 'repeal',
        regulation: impact.regulation,
        date: impact.date,
        title: impact.title,
        text: impact.text,
        diff: impact.diff,
      }))
  }

  return payload
}
