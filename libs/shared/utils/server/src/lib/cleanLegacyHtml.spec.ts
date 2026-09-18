import { cleanLegacyHtml, simpleSanitize } from './cleanLegacyHtml'

const wordDocument = [
  '<html xmlns:o="urn:schemas-microsoft-com:office:office">',
  '<head><meta charset="utf-8"><title>Auglýsing nr. 123/2025</title>',
  '<style>p{margin:0}</style></head>',
  '<body><p>Fyrsta málsgrein.</p></body></html>',
].join('')

describe('simpleSanitize', () => {
  it('drops <title> text instead of leaking it into the content', () => {
    const result = simpleSanitize(wordDocument)
    expect(result).not.toContain('Auglýsing nr. 123/2025')
    expect(result).toContain('<p>Fyrsta málsgrein.</p>')
  })

  it('leaves fragment markup, including root-level tables, untouched', () => {
    const fragment = '<p>Halló</p><table><tr><td>a</td></tr></table>'
    expect(simpleSanitize(fragment)).toBe(fragment)
  })
})

describe('cleanLegacyHtml', () => {
  it('drops <title> text when extracting the body', () => {
    const result = cleanLegacyHtml(wordDocument)
    expect(result).not.toContain('Auglýsing nr. 123/2025')
    expect(result).toContain('<p>Fyrsta málsgrein.</p>')
  })
})
