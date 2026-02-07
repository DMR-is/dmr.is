import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  describe('HTML tag escaping', () => {
    it('should escape script tags', () => {
      const input = '<script>alert("XSS")</script>'
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape img tags', () => {
      const input = '<img src=x onerror=alert("XSS")>'
      const expected = '&lt;img src=x onerror=alert(&quot;XSS&quot;)&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape iframe tags', () => {
      const input = '<iframe src="malicious.com"></iframe>'
      const expected =
        '&lt;iframe src=&quot;malicious.com&quot;&gt;&lt;/iframe&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape bold and italic tags', () => {
      const input = '<b>Bold</b> and <i>Italic</i>'
      const expected = '&lt;b&gt;Bold&lt;/b&gt; and &lt;i&gt;Italic&lt;/i&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('Special character escaping', () => {
    it('should escape ampersands', () => {
      const input = 'Company & Sons'
      const expected = 'Company &amp; Sons'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape double quotes', () => {
      const input = 'John "Jack" Doe'
      const expected = 'John &quot;Jack&quot; Doe'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape single quotes', () => {
      const input = "O'Brien & Associates"
      const expected = 'O&#39;Brien &amp; Associates'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape less-than and greater-than signs', () => {
      const input = '5 < 10 and 10 > 5'
      const expected = '5 &lt; 10 and 10 &gt; 5'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('Complex XSS payloads', () => {
    it('should escape complex XSS payload with multiple attack vectors', () => {
      const input = '<script>alert(document.cookie)</script><img src=x onerror=alert(1)>'
      const expected =
        '&lt;script&gt;alert(document.cookie)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape JavaScript event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>'
      const expected =
        '&lt;div onclick=&quot;alert(&#39;XSS&#39;)&quot;&gt;Click me&lt;/div&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape mixed quotes and HTML', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Link</a>'
      const expected =
        '&lt;a href=&quot;javascript:alert(&#39;XSS&#39;)&quot;&gt;Link&lt;/a&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('Edge cases', () => {
    it('should return undefined for undefined input', () => {
      expect(escapeHtml(undefined)).toBeUndefined()
    })

    it('should return null for null input', () => {
      expect(escapeHtml(null)).toBeNull()
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should handle plain text without special characters', () => {
      const input = 'Plain text without special characters'
      expect(escapeHtml(input)).toBe(input)
    })

    it('should handle Unicode characters', () => {
      const input = 'Reykjavík & Hafnarfjörður'
      const expected = 'Reykjavík &amp; Hafnarfjörður'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('Order of operations', () => {
    it('should escape ampersands first to avoid double-escaping', () => {
      // This tests that & is escaped before other characters
      // If we had "&lt;" in the input, it should become "&amp;lt;" not "&lt;"
      const input = '&lt;script&gt;'
      const expected = '&amp;lt;script&amp;gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should handle already-escaped entities correctly', () => {
      const input = '&amp; &lt; &gt;'
      const expected = '&amp;amp; &amp;lt; &amp;gt;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })

  describe('Real-world examples', () => {
    it('should escape Icelandic company name with special characters', () => {
      const input = 'Jón & Gunna ehf. "The Best Company"'
      const expected = 'Jón &amp; Gunna ehf. &quot;The Best Company&quot;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should escape address with quotes', () => {
      const input = 'Laugavegur 1 "Main Street"'
      const expected = 'Laugavegur 1 &quot;Main Street&quot;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should preserve legitimate text while escaping HTML', () => {
      const input = 'Property owned by A&B Corporation <verified>'
      const expected = 'Property owned by A&amp;B Corporation &lt;verified&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })
})
