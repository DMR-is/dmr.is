/** @jest-environment jsdom */
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import type { HTMLText } from '@dmr.is/regulations-tools/types'

import { HTMLEditor } from './Editor'

type EditorProps = {
  valueRef: { current: () => HTMLText }
  onChange: () => void
  onBlur: () => void
}

// Stands in for EditorV2: holds the text it would serialize, and exposes the
// props it was given so the tests can fire change and blur events.
let mockEditor: EditorProps
let mockText = ''
jest.mock('@dmr.is/regulations-tools/EditorV2', () => ({
  EditorV2: (props: EditorProps) => {
    props.valueRef.current = () => mockText as HTMLText
    mockEditor = props
    return null
  },
}))
jest.mock('@dmr.is/regulations-tools/editorV2.css', () => ({}))
jest.mock('./Editor.css', () => ({ classes: {} }))

const type = (value: string) => {
  mockText = value
  act(() => mockEditor.onChange())
}

describe('HTMLEditor', () => {
  let container: HTMLDivElement
  let root: Root
  const onChange = jest.fn()
  const onBlur = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    ;(
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    onChange.mockReset()
    onBlur.mockReset()
    mockText = ''
    container = document.createElement('div')
    root = createRoot(container)
    act(() =>
      root.render(
        <HTMLEditor
          onChange={onChange}
          onBlur={onBlur}
          handleUpload={jest.fn()}
        />,
      ),
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    jest.useRealTimers()
  })

  it('reads the value once per pause in typing', () => {
    type('a')
    type('ab')
    type('abc')
    expect(onChange).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(250))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('abc')
  })

  it('flushes a pending change on blur, before onBlur', () => {
    type('abc')
    act(() => mockEditor.onBlur())

    expect(onChange).toHaveBeenCalledWith('abc')
    expect(onBlur).toHaveBeenCalledWith('abc')
    expect(onChange.mock.invocationCallOrder[0]).toBeLessThan(
      onBlur.mock.invocationCallOrder[0],
    )

    act(() => jest.advanceTimersByTime(250))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('flushes a pending change on unmount', () => {
    type('abc')
    act(() => root.unmount())

    expect(onChange).toHaveBeenCalledWith('abc')
    root = createRoot(container)
  })

  it('does not call onChange on blur when nothing changed', () => {
    act(() => mockEditor.onBlur())

    expect(onChange).not.toHaveBeenCalled()
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
