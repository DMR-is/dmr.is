import { RegulationAppendix, RegulationDraft } from '@dmr.is/shared-dto'

type PublishAppendix = { title: string; text: string }

export type RegulationPublishPayload = {
  name: string
  title: string
  text: string
  appendixes?: PublishAppendix[]
  comments?: string
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
    appendixes?: PublishAppendix[]
    comments?: string
  }>
}

/**
 * Only the title and text are sent. island.is also keeps a per-appendix
 * `diff`, but regulations-api computes the changeset itself.
 */
const toPublishAppendixes = (
  appendixes: RegulationAppendix[] | undefined,
): PublishAppendix[] | undefined =>
  appendixes?.map(({ title, text }) => ({ title, text }))

/**
 * Transform a RegulationDraft (from regulations-admin API) into the payload
 * expected by the regulations-api publish endpoint.
 *
 * Text, appendixes and comments are sent apart. regulations-api combines them
 * into the single stored HTML blob, in the format its readers split back.
 */
export function convertDraftToPublishPayload(
  draft: RegulationDraft,
  publishedDate: Date,
): RegulationPublishPayload {
  const payload: RegulationPublishPayload = {
    name: draft.name ?? '',
    title: draft.title,
    text: draft.text,
    appendixes: toPublishAppendixes(draft.appendixes),
    comments: draft.comments,
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
        appendixes: toPublishAppendixes(impact.appendixes),
        comments: impact.comments,
      }))
  }

  return payload
}
