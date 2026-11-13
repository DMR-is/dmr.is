/** @jest-environment jsdom */
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import type { EditorV2 } from '@dmr.is/regulations-tools/EditorV2'
import type { HTMLText } from '@dmr.is/regulations-tools/types'

import { HTMLEditor } from './Editor'

type EditorProps = Parameters<typeof EditorV2>[0]

// Stands in for EditorV2: holds the text it would serialize, exposes the props
// it was given, and renders a focusable text area plus one of its own controls
// (as a dialog input or menu button would be) so blur can be tested.
let mockEditor: EditorProps
let mockText = ''
jest.mock('@dmr.is/regulations-tools/EditorV2', () => ({
  EditorV2: (props: EditorProps) => {
    props.valueRef.current = () => mockText as HTMLText
    mockEditor = props
    return (
      <div>
        <div data-testid="text" tabIndex={0} />
        <button data-testid="control" />
      </div>
    )
  },
}))
jest.mock('@dmr.is/regulations-tools/editorV2.css', () => ({}))
jest.mock('./Editor.css', () => ({ classes: {} }))

const type = (value: string) => {
  mockText = value
  act(() => mockEditor.onChange?.())
}

describe('HTMLEditor', () => {
  let container: HTMLDivElement
  let outside: HTMLButtonElement
  let root: Root
  const onChange = jest.fn()
  const onBlur = jest.fn()
  const handleUpload = jest.fn()

  const get = (id: string) =>
    container.querySelector(`[data-testid="${id}"]`) as HTMLElement
  const focus = (element: HTMLElement) => act(() => element.focus())

  beforeEach(() => {
    jest.useFakeTimers()
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    onChange.mockReset()
    onBlur.mockReset()
    mockText = ''
    container = document.createElement('div')
    outside = document.createElement('button')
    document.body.append(container, outside)
    root = createRoot(container)
    act(() =>
      root.render(
        <HTMLEditor
          onChange={onChange}
          onBlur={onBlur}
          handleUpload={handleUpload}
        />,
      ),
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    outside.remove()
    jest.useRealTimers()
  })

  it('reads the value once per pause in typing', () => {
    type('a')
    type('ab')
    type('abc')
    expect(onChange).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(249))
    expect(onChange).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(1))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('abc')
  })

  it('flushes a pending change on blur, before onBlur', () => {
    focus(get('text'))
    type('abc')
    focus(outside)

    expect(onChange).toHaveBeenCalledWith('abc')
    expect(onBlur).toHaveBeenCalledWith('abc')
    expect(onChange.mock.invocationCallOrder[0]).toBeLessThan(
      onBlur.mock.invocationCallOrder[0],
    )

    act(() => jest.advanceTimersByTime(250))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("ignores focus moving into the editor's own controls", () => {
    focus(get('text'))
    type('abc')
    focus(get('control'))

    expect(onBlur).not.toHaveBeenCalled()

    focus(outside)

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledWith('abc')
  })

  it('counts the next outside interaction as leaving when focus was lost without a blur', () => {
    focus(get('text'))
    type('abc')
    focus(get('control'))
    // Closing the table menu removes its focused button; jsdom, like some
    // browsers, fires no blur for that.
    act(() => get('control').remove())
    expect(onBlur).not.toHaveBeenCalled()

    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => jest.runOnlyPendingTimers())

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledWith('abc')
  })

  it('counts focus moving outside as leaving when focus was lost without a blur', () => {
    focus(get('text'))
    type('abc')
    focus(get('control'))
    act(() => get('control').remove())

    focus(outside)
    act(() => jest.runOnlyPendingTimers())

    expect(onBlur).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledWith('abc')
  })

  it('does not count an outside press that leaves focus in the editor', () => {
    // A scrollbar, or a control that prevents default on mousedown
    focus(get('text'))
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => jest.runOnlyPendingTimers())

    expect(onBlur).not.toHaveBeenCalled()
  })

  it('drops a pending outside check when the editor unmounts', () => {
    focus(get('text'))
    focus(get('control'))
    act(() => get('control').remove())
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => root.unmount())
    act(() => jest.runOnlyPendingTimers())

    expect(onBlur).not.toHaveBeenCalled()
    root = createRoot(container)
  })

  it('does not count an outside interaction twice after a normal blur', () => {
    focus(get('text'))
    focus(outside)
    act(() => {
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    })
    act(() => jest.runOnlyPendingTimers())

    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('flushes a pending change on unmount', () => {
    type('abc')
    act(() => root.unmount())

    expect(onChange).toHaveBeenCalledWith('abc')
    root = createRoot(container)
  })

  it('calls the latest onChange prop', () => {
    const nextOnChange = jest.fn()
    type('abc')
    act(() =>
      root.render(
        <HTMLEditor
          onChange={nextOnChange}
          onBlur={onBlur}
          handleUpload={handleUpload}
        />,
      ),
    )

    act(() => jest.advanceTimersByTime(250))

    expect(onChange).not.toHaveBeenCalled()
    expect(nextOnChange).toHaveBeenCalledWith('abc')
  })

  it('passes the default toolbar when editable and none when readonly', () => {
    expect(mockEditor.toolbar).toBeUndefined()
    expect(mockEditor.readOnly).toBe(false)

    act(() =>
      root.render(
        <HTMLEditor readonly onChange={onChange} handleUpload={handleUpload} />,
      ),
    )

    expect(mockEditor.toolbar).toBe(false)
    expect(mockEditor.readOnly).toBe(true)
  })

  it("passes the caller's uploader through", () => {
    expect(mockEditor.fileUploader).toBe(handleUpload)
  })

  it('does not call onChange on blur when nothing changed', () => {
    focus(get('text'))
    focus(outside)

    expect(onChange).not.toHaveBeenCalled()
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
