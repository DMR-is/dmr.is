import { getHtmlTextLength } from './serverUtils'

/**
 * Characterization tests for `getHtmlTextLength`.
 *
 * This is not a general-purpose sanitizer test. The number this function
 * returns is an **invoicing input**: it is multiplied by `feeCode.value` in
 * `advert.model.ts`, `price-calculator.service.ts` and `price.service.ts`. A
 * shift in how `sanitize-html` decodes entities or collapses whitespace
 * silently changes what customers are billed.
 *
 * Every expected value below was **measured** against sanitize-html 2.17.5,
 * not reasoned about. They exist to make a behaviour change in a dependency
 * bump fail loudly instead of landing as a pricing change nobody reviewed.
 *
 * If one of these moves, that is a product decision, not a merge conflict.
 */
describe('getHtmlTextLength', () => {
  describe('tag stripping', () => {
    it('counts plain text unchanged', () => {
      expect(getHtmlTextLength('Halló heimur')).toBe(12)
    })

    it('does not count the tags themselves', () => {
      expect(getHtmlTextLength('<p>Halló heimur</p>')).toBe(12)
    })

    it('does not count attributes', () => {
      expect(getHtmlTextLength('<p class="x" style="color:red">Halló</p>')).toBe(
        5,
      )
    })

    it('counts text across nested tags', () => {
      expect(
        getHtmlTextLength('<p><strong>Auglýsing</strong> um <em>úrskurð</em></p>'),
      ).toBe(20)
    })

    it('counts nothing for an empty string', () => {
      expect(getHtmlTextLength('')).toBe(0)
    })

    it('drops comments', () => {
      expect(getHtmlTextLength('<!-- hidden -->Halló')).toBe(5)
    })

    it('drops script and style contents', () => {
      expect(getHtmlTextLength('<script>alert(1)</script>Halló')).toBe(5)
      expect(getHtmlTextLength('<style>p{color:red}</style>Halló')).toBe(5)
    })

    it('counts text on either side of a void tag as adjacent', () => {
      expect(getHtmlTextLength('a<br/>b')).toBe(2)
    })
  })

  /**
   * The load-bearing case. `&` survives sanitization *re-encoded* as `&amp;`,
   * so a single ampersand bills as five characters, not one. Named entities
   * that map to a plain character (`&nbsp;`) decode and bill as one.
   */
  describe('entity handling', () => {
    it('re-encodes a named ampersand entity rather than decoding it', () => {
      expect(getHtmlTextLength('Jón &amp; Gunna')).toBe(15)
    })

    it('encodes a bare ampersand to the same length', () => {
      expect(getHtmlTextLength('Jón & Gunna')).toBe(15)
    })

    it('treats an ampersand entity without its semicolon the same way', () => {
      expect(getHtmlTextLength('Jón &amp Gunna')).toBe(15)
    })

    it('re-encodes angle-bracket entities', () => {
      expect(getHtmlTextLength('a &lt;b&gt; c')).toBe(13)
    })

    it('does not collapse a double-encoded ampersand', () => {
      expect(getHtmlTextLength('a &amp;amp; b')).toBe(13)
    })

    it('decodes a non-breaking space to a single character', () => {
      expect(getHtmlTextLength('Jón&nbsp;Gunnarsson')).toBe(14)
    })

    it('decodes a decimal numeric entity to one character', () => {
      expect(getHtmlTextLength('J&#243;n')).toBe(3)
    })

    it('decodes a hex numeric entity to one character', () => {
      expect(getHtmlTextLength('J&#x00F3;n')).toBe(3)
    })

    /**
     * Called out explicitly in the htmlparser2 10 -> 12 changelog that rides
     * along with sanitize-html 2.17.6. Pinned so that change cannot pass
     * through unnoticed.
     */
    it('decodes a zero-padded numeric entity to one character', () => {
      expect(getHtmlTextLength('J&#0000243;n')).toBe(3)
    })

    it('counts literal Icelandic characters one per code unit', () => {
      expect(getHtmlTextLength('Þórður Ægisson Öðinsson')).toBe(23)
    })
  })

  /**
   * Also named in the htmlparser2 10 -> 12 changelog ("double-encoding of
   * entities inside raw text elements like textarea and option"). Today both
   * are discarded wholesale.
   */
  describe('raw text elements', () => {
    it('drops textarea contents entirely', () => {
      expect(getHtmlTextLength('<textarea>a &amp; b</textarea>')).toBe(0)
    })

    it('drops option contents entirely', () => {
      expect(getHtmlTextLength('<option>a &amp; b</option>')).toBe(0)
    })
  })

  describe('malformed input', () => {
    it('counts nothing for an unclosed tag with no text', () => {
      expect(getHtmlTextLength('<hello')).toBe(0)
    })

    it('still counts text inside an unclosed block tag', () => {
      expect(getHtmlTextLength('<p>Halló')).toBe(5)
    })
  })

  describe('whitespace', () => {
    it('preserves runs of spaces between blocks', () => {
      expect(getHtmlTextLength('<p>a</p>   <p>b</p>')).toBe(5)
    })

    it('preserves a newline between blocks', () => {
      expect(getHtmlTextLength('<p>a</p>\n<p>b</p>')).toBe(3)
    })
  })
})
