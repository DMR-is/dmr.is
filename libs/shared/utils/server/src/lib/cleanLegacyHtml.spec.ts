import {
  cleanLegacyHtml,
  sanitizeForDisplay,
  simpleSanitize,
} from './cleanLegacyHtml'

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

describe('sanitizeForDisplay', () => {
  it('keeps only alignment and width in table styles', () => {
    expect(
      sanitizeForDisplay(
        '<table style="position:fixed;inset:0"><tbody><tr>' +
          '<td style="position:fixed;z-index:9999;background:url(https://example.com/x.png);width:30%;text-align:right;vertical-align:top">a</td>' +
          '</tr></tbody></table>',
      ),
    ).toBe(
      '<table><tbody><tr><td style="width:30%;text-align:right;vertical-align:top">a</td></tr></tbody></table>',
    )
  })

  it('keeps list styles', () => {
    const html = '<ol style="list-style-type:lower-alpha"><li>a</li></ol>'
    expect(sanitizeForDisplay(html)).toBe(html)
  })

  it('allows data: on images only', () => {
    expect(sanitizeForDisplay('<a href="data:text/html,x">a</a>')).toBe(
      '<a>a</a>',
    )
    expect(sanitizeForDisplay('<img src="data:image/png;base64,AAAA" />')).toBe(
      '<img src="data:image/png;base64,AAAA" />',
    )
  })

  it('removes javascript: links and event handlers', () => {
    expect(
      sanitizeForDisplay(
        '<a href=" JaVaScRiPt:alert(1)" onclick="x()">a</a><img src="x" onerror="x()" />',
      ),
    ).toBe('<a>a</a><img src="x" />')
  })
})

describe('cleanLegacyHtml', () => {
  it('drops <title> text when extracting the body', () => {
    const result = cleanLegacyHtml(wordDocument)
    expect(result).not.toContain('Auglýsing nr. 123/2025')
    expect(result).toContain('<p>Fyrsta málsgrein.</p>')
  })
})
