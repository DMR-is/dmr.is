import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { HTMLReadOnly } from './HTMLReadOnly'

jest.mock('./Editor.css', () => ({
  classes: { wrapper: 'wrapper', editingpane: 'pane', editor: 'editor' },
}))

describe('HTMLReadOnly', () => {
  let container: HTMLDivElement
  let root: Root

  const render = (html?: string | null) => {
    act(() => root.render(<HTMLReadOnly html={html} />))
    return container.querySelector('.editor') as HTMLElement
  }

  beforeEach(() => {
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
  })

  it('renders the stored markup inside the editor classes', () => {
    const text = render(
      '<p>Fyrsta <strong>málsgrein</strong></p><ul><li>atriði</li></ul>',
    )

    expect(container.querySelector('.wrapper > .pane > .editor')).toBe(text)
    expect(text.innerHTML).toBe(
      '<p>Fyrsta <strong>málsgrein</strong></p><ul><li>atriði</li></ul>',
    )
  })

  it('strips scripts, event handlers and javascript: links', () => {
    const text = render(
      '<p onclick="alert(1)">a</p><img src="x" onerror="alert(1)">' +
        '<script>alert(1)</script><a href="javascript:alert(1)">b</a>',
    )

    expect(text.querySelector('script')).toBeNull()
    expect(text.querySelector('[onclick], [onerror]')).toBeNull()
    expect(text.querySelector('a')?.getAttribute('href')).toBeNull()
    expect(text.textContent).toBe('ab')
  })

  it('drops positioning and background images from table styles', () => {
    const cell = render(
      '<table><tbody><tr><td style="position:fixed;inset:0;background:url(https://example.com/x.png);text-align:center">a</td></tr></tbody></table>',
    ).querySelector('td')

    expect(cell?.getAttribute('style')).toBe('text-align:center')
  })

  it('renders nothing for an empty body', () => {
    expect(render(null).innerHTML).toBe('')
    expect(render(undefined).innerHTML).toBe('')
  })
})
