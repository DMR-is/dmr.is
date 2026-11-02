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

  it('preserves authored link attributes for ingestion', () => {
    const html =
      '<a href="https://example.com" name="section" target="namedWindow" rel="opener">a</a>'
    expect(simpleSanitize(html)).toBe(html)
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

  it('keeps width on tables and cells only, up to four digits', () => {
    expect(
      sanitizeForDisplay(
        '<p style="width:50%">a</p><table style="width:9999999px"><tbody><tr>' +
          '<td style="width:120px">b</td></tr></tbody></table>',
      ),
    ).toBe(
      '<p>a</p><table><tbody><tr><td style="width:120px">b</td></tr></tbody></table>',
    )
  })

  it.each(['9999px', '9999pt', '9999', '999%'])(
    'keeps the cell width %s',
    (width) => {
      const html = `<table><tbody><tr><td style="width:${width}">a</td></tr></tbody></table>`
      expect(sanitizeForDisplay(html)).toBe(html)
    },
  )

  it.each(['10000px', '1000%', '20em', '20rem'])(
    'drops the cell width %s',
    (width) => {
      expect(
        sanitizeForDisplay(
          `<table><tbody><tr><td style="width:${width}">a</td></tr></tbody></table>`,
        ),
      ).toBe('<table><tbody><tr><td>a</td></tr></tbody></table>')
    },
  )

  it('keeps only the content classes the editor styling targets', () => {
    expect(
      sanitizeForDisplay(
        '<div class="regtools-dialog--panel">a</div>' +
          '<p class="indented MsoNormal">b</p>' +
          '<p class="Dags">c</p>' +
          '<table class="layout"><tbody><tr><td>d</td></tr></tbody></table>',
      ),
    ).toBe(
      '<div>a</div><p class="indented">b</p><p class="Dags">c</p>' +
        '<table class="layout"><tbody><tr><td>d</td></tr></tbody></table>',
    )
  })

  it('drops id and name', () => {
    expect(
      sanitizeForDisplay('<p id="main">a</p><a name="x" href="#y">b</a>'),
    ).toBe('<p>a</p><a href="#y" rel="noopener noreferrer">b</a>')
  })

  it('replaces authored opener relationships with safe link attributes', () => {
    expect(
      sanitizeForDisplay(
        '<a href="https://example.com" target="_blank" rel="opener">a</a>',
      ),
    ).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">a</a>',
    )
  })

  it.each(['_self', '_blank', '_SELF', '_BLANK'])(
    'allows the supported link target %s',
    (target) => {
      expect(sanitizeForDisplay(`<a href="/x" target="${target}">a</a>`)).toBe(
        `<a href="/x" target="${target.toLowerCase()}" rel="noopener noreferrer">a</a>`,
      )
    },
  )

  it.each(['namedWindow', '_top', '_parent'])(
    'drops the unsupported link target %s',
    (target) => {
      expect(sanitizeForDisplay(`<a href="/x" target="${target}">a</a>`)).toBe(
        '<a href="/x" rel="noopener noreferrer">a</a>',
      )
    },
  )

  it('preserves the existing content transforms in display mode', () => {
    expect(
      sanitizeForDisplay(
        '<div class="advertSubSerial" style="position:fixed">a</div>',
      ),
    ).toBe('<p style="text-align:center">a</p>')
  })

  it('keeps list styles', () => {
    const html = '<ol style="list-style-type:lower-alpha"><li>a</li></ol>'
    expect(sanitizeForDisplay(html)).toBe(html)
  })

  it('allows data: on images only', () => {
    expect(sanitizeForDisplay('<a href="data:text/html,x">a</a>')).toBe(
      '<a rel="noopener noreferrer">a</a>',
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
    ).toBe('<a rel="noopener noreferrer">a</a><img src="x" />')
  })
})

describe('cleanLegacyHtml', () => {
  it('drops <title> text when extracting the body', () => {
    const result = cleanLegacyHtml(wordDocument)
    expect(result).not.toContain('Auglýsing nr. 123/2025')
    expect(result).toContain('<p>Fyrsta málsgrein.</p>')
  })
})
