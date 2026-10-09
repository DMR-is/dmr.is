/** @jest-environment jsdom */
import { unwrapContainers } from './unwrapContainers'

const bare = '<p>Fyrsta málsgrein.</p><p align="center">Önnur.</p>'

describe('unwrapContainers', () => {
  it('turns a wrapped document into the bare one', () => {
    expect(unwrapContainers(`<div class="advert">${bare}</div>`)).toBe(bare)
  })

  it('flattens nested containers fully', () => {
    expect(
      unwrapContainers(
        `<div><div class="signature"><div class="signature__content">${bare}</div></div></div>`,
      ),
    ).toBe(bare)
  })

  it('keeps the text of mixed inline and block content', () => {
    expect(
      unwrapContainers('<div>Inngangur <em>texti</em><p>Málsgrein.</p></div>'),
    ).toBe('Inngangur <em>texti</em><p>Málsgrein.</p>')
  })

  it('leaves a div holding only inline content alone', () => {
    const html = '<div class="x">Aðeins <strong>texti</strong></div>'
    expect(unwrapContainers(html)).toBe(html)
  })

  it('leaves bare paragraphs unchanged', () => {
    expect(unwrapContainers(bare)).toBe(bare)
  })
})
