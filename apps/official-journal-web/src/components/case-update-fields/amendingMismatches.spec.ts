/** @jest-environment jsdom */
import findAmendingMismatches from '@dmr.is/regulations-tools/amendingMismatches-browser'
import getStructuredDiff from '@dmr.is/regulations-tools/structuredDiff-browser'
import { HTMLText } from '@dmr.is/regulations-tools/types'

import { CaseAddition, RegulationImpact } from '../../gen/fetch'
import { getAmendingMismatches } from './amendingMismatches'

const FEES =
  '<h3>5. gr.</h3><p>Gjaldið er kr. 1.500 á ári.</p><h3>6. gr.</h3><p>Umsókn skal fylgja vottorð.</p>'

const amend = (
  after: string,
  overrides: Partial<RegulationImpact> = {},
): RegulationImpact => ({
  id: '1',
  type: 'amend',
  regulation: '0123/2020',
  date: '2026-12-01',
  diff: getStructuredDiff(FEES as HTMLText, after as HTMLText).diff,
  ...overrides,
})

const raised = amend(FEES.replace('1.500', '1.800'))

const text = (amount: string) =>
  `<h3>1. gr.</h3><p>Í stað „kr. 1.500“ í 5. gr. reglugerðarinnar kemur: kr. ${amount}.</p>`

const check = (
  html: string,
  impacts: RegulationImpact[],
  additions?: CaseAddition[],
) => getAmendingMismatches(findAmendingMismatches, { html, additions, impacts })

const NONE = { values: [], wording: [] }

describe('getAmendingMismatches', () => {
  it('finds nothing when the text makes the recorded change', () => {
    expect(check(text('1.800'), [raised])).toEqual(NONE)
  })

  it('reports an amount changed in the text alone, both ways', () => {
    expect(check(text('1.900'), [raised]).values).toEqual([
      {
        type: 'missingFromText',
        text: '1.800',
        regulation: '123/2020',
        section: '5. gr.',
      },
      { type: 'notInChanges', text: '1.900', section: '1. gr.' },
    ])
  })

  it('groups wording by regulation and section', () => {
    const certificate = amend(
      FEES.replace('vottorð.', 'vottorð um búsetu og skráningu lögheimilis.'),
    )
    expect(
      check(
        '<h3>1. gr.</h3><p>Við 6. gr. reglugerðarinnar bætist nýr málsliður.</p>',
        [certificate],
      ),
    ).toEqual({
      values: [],
      wording: [
        {
          regulation: '123/2020',
          section: '6. gr.',
          texts: ['vottorð um búsetu og skráningu lögheimilis'],
        },
      ],
    })
  })

  it('reads the appendixes published with the text, in order', () => {
    const lead = '<h3>1. gr.</h3><p>5. gr. reglugerðarinnar breytist.</p>'
    const appendix = (order: number, html: string): CaseAddition => ({
      id: `${order}`,
      title: `Viðauki ${order}`,
      html,
      order,
    })
    expect(
      check(
        lead,
        [raised],
        [appendix(2, '<p>Gjald: kr. 1.800.</p>'), appendix(1, '<p>Skrá.</p>')],
      ),
    ).toEqual(NONE)
  })

  it('compares an appendix the text replaces with the changed appendix', () => {
    const tariff = '<p>Skoðun: kr. 2.000.</p><p>Endurskoðun: kr. 3.500.</p>'
    const html = `${text(
      '1.800',
    )}<h3>2. gr.</h3><p>Viðauki I við reglugerðina orðast svo:</p>${tariff}`
    const appendixes = [{ title: 'Viðauki I', text: tariff }]
    expect(check(html, [{ ...raised, appendixes }])).toEqual(NONE)
    expect(
      check(html.replace('3.500', '3.600'), [{ ...raised, appendixes }]).values,
    ).toEqual([{ type: 'notInChanges', text: '3.600', section: '2. gr.' }])
  })

  it('reports nothing as missing from changes when a change has no diff', () => {
    const unknown = { ...raised, id: '2', diff: undefined }
    expect(check(text('1.900'), [raised, unknown]).values).toEqual([
      {
        type: 'missingFromText',
        text: '1.800',
        regulation: '123/2020',
        section: '5. gr.',
      },
    ])
  })

  it('leaves out dropped changes, repeals and an empty text', () => {
    expect(check(text('1.900'), [{ ...raised, dropped: true }])).toEqual(NONE)
    expect(check(text('1.900'), [{ ...raised, type: 'repeal' }])).toEqual(NONE)
    expect(check('', [raised])).toEqual(NONE)
  })
})
