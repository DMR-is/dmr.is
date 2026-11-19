/**
 * @jest-environment jsdom
 */
// jsdom because the EditorV2 checks below parse HTML through the DOM, as the
// editor does in the browser. The sanitizer itself does not need it.
import {
  findUnsupportedElements,
  roundTrip,
} from '@dmr.is/regulations-tools/_editorV2/fidelity'

import { sanitizeLegalGazetteHtml } from './sanitizeLegalGazetteHtml'

// The markup from the admin screenshot that prompted this: empty, coloured
// spans left behind by a paste, which EditorV2 warns it cannot keep.
const PASTED_SPANS =
  '<p><span style="color: rgba(255, 0, 0, 0.5);"><span style="background-color: rgba(204, 153, 0, 0.1);"> </span></span><em>Aðilar málsins eru:</em></p>' +
  '<p><span style="background-color: rgba(204, 153, 0, 0.1);"> </span>Jón Jónsson</p>'

const WORD_PASTE = `
  <!--[if gte mso 9]><xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml><![endif]-->
  <style>p.MsoNormal { margin: 0 }</style>
  <div class="WordSection1">
    <p class="MsoNormal" style="margin-bottom:0cm;line-height:normal;mso-pagination:none">
      <b><span lang="IS" style="font-size:12.0pt;font-family:'Times New Roman',serif">Innköllun</span></b><o:p></o:p>
    </p>
    <p class="MsoNormal" align="center"><font face="Arial" color="#333">Miðjað</font></p>
    <table class="MsoTableGrid" border="1" cellpadding="0" style="border-collapse:collapse;border:none">
      <tr><td width="200" valign="top" style="width:150pt;border:solid windowtext 1.0pt;padding:0cm 5.4pt">A</td></tr>
    </table>
  </div>`

// What the Legal Gazette toolbar produces: bold, italic, underline,
// alignment, numbered and bulleted lists, tables and links.
const EDITOR_SAMPLES = [
  '<p style="text-align: center;">Miðjað <strong>feitt</strong> <em>skáletrað</em> <u>undirstrikað</u></p>',
  '<p style="text-align: justify;">Jafnað</p><p style="text-align: right;">Hægri</p>',
  '<ol><li><p>Fyrsta</p></li><li><p>Annað</p></li></ol><ul><li><p>Punktur</p></li></ul>',
  '<ol start="3" type="a"><li><p>c-liður</p></li></ol>',
  '<ol><li><p>Fyrsta</p></li><li value="7"><p>Sjöunda</p></li></ol>',
  '<table class="layout"><tbody><tr><td>Án ramma</td></tr></tbody></table>',
  '<table class="layout layout--list"><tbody><tr><td>a)</td><td>Upptalning</td></tr></tbody></table>',
  '<table><tbody><tr><th>Nafn</th><th style="text-align: center;">Kennitala</th></tr><tr><td colspan="2">Jón</td></tr></tbody></table>',
  '<p><a target="_blank" rel="noopener noreferrer" href="https://island.is">island.is</a> og <a href="mailto:a@b.is">netfang</a></p>',
  '<p>Lína<br>önnur lína</p>',
]

describe('sanitizeLegalGazetteHtml', () => {
  it('passes null, undefined and empty strings through', () => {
    expect(sanitizeLegalGazetteHtml(null)).toBeNull()
    expect(sanitizeLegalGazetteHtml(undefined)).toBeUndefined()
    expect(sanitizeLegalGazetteHtml('')).toBe('')
  })

  describe('paste residue', () => {
    it('removes the styled spans from the screenshot and keeps the text', () => {
      expect(sanitizeLegalGazetteHtml(PASTED_SPANS)).toBe(
        '<p> <em>Aðilar málsins eru:</em></p><p> Jón Jónsson</p>',
      )
    })

    it('leaves nothing the editor would warn about', () => {
      expect(findUnsupportedElements(PASTED_SPANS)).not.toEqual([])
      expect(
        findUnsupportedElements(sanitizeLegalGazetteHtml(PASTED_SPANS)),
      ).toEqual([])
      expect(
        findUnsupportedElements(sanitizeLegalGazetteHtml(WORD_PASTE)),
      ).toEqual([])
    })

    it('strips Word markup down to text, structure and alignment', () => {
      const clean = sanitizeLegalGazetteHtml(WORD_PASTE)

      expect(clean).not.toMatch(
        /class=|lang=|mso-|font-|<span|<font|<o:p|<style|<!--/,
      )
      expect(clean).not.toContain('MsoNormal {')
      expect(clean).toContain('<b>Innköllun</b>')
      expect(clean).toContain('<p style="text-align:center">Miðjað</p>')
      expect(clean.replace(/\s+/g, '')).toContain(
        '<table><tr><td>A</td></tr></table>',
      )
      expect(clean).not.toMatch(/<p>\s*<p>/)
    })

    it('turns a <div> into a paragraph rather than running it into the next block', () => {
      expect(
        sanitizeLegalGazetteHtml('<div>Eitt</div><div align="right">Tvö</div>'),
      ).toBe('<p>Eitt</p><p style="text-align:right">Tvö</p>')
    })

    it('unwraps a <div> that wraps other blocks instead of nesting paragraphs', () => {
      expect(
        sanitizeLegalGazetteHtml(
          '<div class="WordSection1"><p>Eitt</p><div>Tvö</div></div>',
        ),
      ).toBe('<p>Eitt</p><p>Tvö</p>')
    })

    it('gives loose text beside blocks in a <div> its own paragraph', () => {
      expect(
        sanitizeLegalGazetteHtml(
          '<div><p>Fjárhæðir</p>100</div><div>200<p>Samtals</p></div>',
        ),
      ).toBe('<p>Fjárhæðir</p><p>100</p><p>200</p><p>Samtals</p>')
      expect(
        sanitizeLegalGazetteHtml(
          '<div>\n  <p>Eitt</p>\n  <b>&lt;b&gt;</b> og <i>Tvö</i>\n</div>',
        ),
      ).toBe('\n  <p>Eitt</p><p>\n  <b>&lt;b&gt;</b> og <i>Tvö</i>\n</p>')
    })

    it('keeps alignment from a legacy align attribute', () => {
      expect(sanitizeLegalGazetteHtml('<p align="center">x</p>')).toBe(
        '<p style="text-align:center">x</p>',
      )
      expect(sanitizeLegalGazetteHtml('<td align="bogus">x</td>')).toBe(
        '<td>x</td>',
      )
    })

    it('drops every inline style except alignment', () => {
      expect(
        sanitizeLegalGazetteHtml(
          '<p style="color: red; text-align: center; margin-left: 2em">x</p>' +
            '<td style="width: 50%; text-align: left; border: 1px solid">y</td>',
        ),
      ).toBe(
        '<p style="text-align:center">x</p><td style="text-align:left">y</td>',
      )
    })
  })

  it('keeps a whole-number list item value and drops anything else', () => {
    expect(
      sanitizeLegalGazetteHtml(
        '<ol><li value="7"><p>a</p></li><li value="x"><p>b</p></li></ol>',
      ),
    ).toBe('<ol><li value="7"><p>a</p></li><li><p>b</p></li></ol>')
  })

  it('keeps only the table-style classes from the editor menu', () => {
    expect(
      sanitizeLegalGazetteHtml(
        '<table class="layout layout--list MsoTableGrid"><tr><td class="x">a</td></tr></table>',
      ),
    ).toBe('<table class="layout layout--list"><tr><td>a</td></tr></table>')
  })

  it('keeps escaped text escaped, inside a <div> too', () => {
    expect(
      sanitizeLegalGazetteHtml(
        '<div>&lt;b&gt;ekki feitt&lt;/b&gt; &amp; Co</div>',
      ),
    ).toBe('<p>&lt;b&gt;ekki feitt&lt;/b&gt; &amp; Co</p>')
  })

  describe('script injection', () => {
    it.each([
      ['a script element', '<p>a</p><script>alert(1)</script>', '<p>a</p>'],
      ['an event handler', '<p onclick="alert(1)">a</p>', '<p>a</p>'],
      [
        'an image with onerror',
        '<p><img src=x onerror="alert(1)">a</p>',
        '<p>a</p>',
      ],
      ['a javascript: link', '<a href="javascript:alert(1)">a</a>', '<a>a</a>'],
      [
        'a data: link',
        '<a href="data:text/html,<script>alert(1)</script>">a</a>',
        '<a>a</a>',
      ],
      [
        'an iframe',
        '<iframe src="https://evil.example"></iframe><p>a</p>',
        '<p>a</p>',
      ],
      ['an svg', '<svg onload="alert(1)"><text>a</text></svg>', 'a'],
      [
        'a style attribute url',
        '<p style="background:url(javascript:alert(1))">a</p>',
        '<p>a</p>',
      ],
    ])('removes %s', (_label, input, expected) => {
      expect(sanitizeLegalGazetteHtml(input)).toBe(expected)
    })

    it('adds rel="noopener noreferrer" to links that open a new tab', () => {
      expect(
        sanitizeLegalGazetteHtml(
          '<a href="https://x.is" target="_blank" rel="opener">x</a>',
        ),
      ).toBe(
        '<a href="https://x.is" target="_blank" rel="noopener noreferrer">x</a>',
      )
    })
  })

  describe('editor output', () => {
    it.each(EDITOR_SAMPLES)('keeps what the editor saves: %s', (sample) => {
      const saved = roundTrip(sample)

      expect(roundTrip(sanitizeLegalGazetteHtml(saved))).toBe(saved)
    })

    it('is idempotent', () => {
      for (const input of [PASTED_SPANS, WORD_PASTE, ...EDITOR_SAMPLES]) {
        const once = sanitizeLegalGazetteHtml(input)
        expect(sanitizeLegalGazetteHtml(once)).toBe(once)
      }
    })
  })
})
