import { contentDisposition } from './content-disposition'

/**
 * The filename here is applicant-supplied — it is whatever a company called the
 * jafnréttisáætlun it uploaded — so these tests are as much about what cannot
 * escape the header as about what a save dialog ends up showing.
 */
describe('contentDisposition', () => {
  it('carries an Icelandic name in the parameter browsers actually decode', () => {
    const header = contentDisposition('inline', 'jafnréttisáætlun.pdf')

    expect(header).toContain(
      "filename*=UTF-8''jafnr%C3%A9ttis%C3%A1%C3%A6tlun.pdf",
    )
    // The quoted parameter is ISO-8859-1 by spec, so the name is folded rather
    // than percent-encoded — a percent-encoded name here is what a browser
    // would show literally.
    expect(header).toContain('filename="jafnr_ttis__tlun.pdf"')
  })

  it('emits an ASCII-only header for a non-ASCII name', () => {
    // A non-ASCII byte in a header value is not transmissible; if this ever
    // fails the response dies at the framework rather than in a save dialog.
    expect(contentDisposition('inline', 'ÁÉÍÓÚ.pdf')).toMatch(
      /^[\x20-\x7e]*$/,
    )
  })

  it('neutralises a CRLF in the filename', () => {
    const header = contentDisposition('inline', 'a\r\nX-Injected: 1.pdf')

    expect(header).not.toContain('\r')
    expect(header).not.toContain('\n')
    expect(header).toContain("filename*=UTF-8''a%0D%0AX-Injected%3A%201.pdf")
  })

  it('does not let a quote close the quoted parameter early', () => {
    const header = contentDisposition('attachment', 'plan "2026".pdf')

    expect(header).toContain('filename="plan _2026_.pdf"')
  })

  it('percent-encodes the characters outside RFC 5987 attr-char', () => {
    // `encodeURIComponent` leaves these four literal, and none of them are
    // attr-char.
    expect(contentDisposition('inline', "a'b(c)d*.pdf")).toContain(
      "filename*=UTF-8''a%27b%28c%29d%2A.pdf",
    )
  })

  it('drops the extended parameter rather than emitting an empty one', () => {
    expect(contentDisposition('inline', '')).toBe(
      'inline; filename="document"',
    )
  })
})
