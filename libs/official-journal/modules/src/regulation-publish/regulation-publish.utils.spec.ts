import { RegulationDraft } from '@dmr.is/shared-dto'

import { convertDraftToPublishPayload } from './regulation-publish.utils'

const draft = (overrides: Partial<RegulationDraft> = {}): RegulationDraft =>
  ({
    id: 'draft-1',
    draftingStatus: 'shipped',
    title: 'Reglugerð um breytingu',
    text: '<p>Meginmál</p>',
    appendixes: [
      {
        title: 'Viðauki I',
        text: '<p>Efni viðauka</p>',
        diff: '<ins>html diff</ins>',
      },
    ],
    comments: '<p>Athugasemd</p>',
    name: '0002/2021',
    signatureDate: '2021-01-01',
    effectiveDate: '2021-01-03',
    type: 'amending',
    ministry: 'Dómsmálaráðuneytið',
    lawChapters: [{ name: 'Kafli', slug: '01a' }],
    impacts: [
      {
        id: 'impact-1',
        regulation: '0001/2020',
        type: 'amend',
        date: '2021-01-03',
        title: 'Breyting á 1. gr.',
        text: '<p>Nýr texti</p>',
        appendixes: [
          {
            title: 'Viðauki II',
            text: '<p>Breyttur viðauki</p>',
            diff: '<ins>html diff</ins>',
          },
        ],
        comments: '<p>Athugasemd við breytingu</p>',
        diff: '<ins>html diff</ins>',
      },
    ],
    ...overrides,
  }) as RegulationDraft

const publishedDate = new Date('2021-01-02T12:00:00Z')

describe('convertDraftToPublishPayload', () => {
  it('sends the regulation text, appendixes and comments apart', () => {
    const payload = convertDraftToPublishPayload(draft(), publishedDate)

    expect(payload.text).toBe('<p>Meginmál</p>')
    expect(payload.appendixes).toEqual([
      { title: 'Viðauki I', text: '<p>Efni viðauka</p>' },
    ])
    expect(payload.comments).toBe('<p>Athugasemd</p>')
  })

  it('sends each impact with its appendixes and comments', () => {
    const [impact] =
      convertDraftToPublishPayload(draft(), publishedDate).impacts ?? []

    expect(impact).toEqual({
      type: 'amend',
      regulation: '0001/2020',
      date: '2021-01-03',
      title: 'Breyting á 1. gr.',
      text: '<p>Nýr texti</p>',
      appendixes: [{ title: 'Viðauki II', text: '<p>Breyttur viðauki</p>' }],
      comments: '<p>Athugasemd við breytingu</p>',
    })
  })

  it('sends no diff, for impacts or appendixes', () => {
    const json = JSON.stringify(
      convertDraftToPublishPayload(draft(), publishedDate),
    )

    expect(json).not.toContain('diff')
  })

  it('leaves out dropped impacts', () => {
    const base = draft()
    const payload = convertDraftToPublishPayload(
      draft({
        impacts: [
          ...(base.impacts ?? []),
          {
            id: 'impact-2',
            regulation: '0003/2019',
            type: 'repeal',
            date: '2021-01-03',
            dropped: true,
          },
        ],
      }),
      publishedDate,
    )

    expect(payload.impacts?.map((i) => i.regulation)).toEqual(['0001/2020'])
  })

  it('handles a draft without appendixes or comments', () => {
    const payload = convertDraftToPublishPayload(
      draft({ appendixes: undefined, comments: undefined, impacts: [] }),
      publishedDate,
    )

    expect(payload.appendixes).toBeUndefined()
    expect(payload.comments).toBeUndefined()
    expect(payload.publishedDate).toBe('2021-01-02')
  })
})
