/** @jest-environment jsdom */
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import {
  flushPendingLocalWrites,
  useUpdateApplication,
} from './useUpdateApplication'

const mockSaveToStorage = jest.fn()

jest.mock('./useLocalFormStorage', () => ({
  useLocalFormStorage: () => ({
    saveToStorage: mockSaveToStorage,
    clearStorage: jest.fn(),
  }),
}))

// Any trpc.x.y(...) call just returns an empty options object
jest.mock('../lib/trpc/client/trpc', () => {
  const proxy: unknown = new Proxy(() => ({}), {
    get: () => proxy,
    apply: () => ({}),
  })
  return { useTRPC: () => proxy }
})

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({}),
  useSuspenseQuery: () => ({ data: { answers: {} } }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('@dmr.is/ui/components/island-is/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

const APPLICATION_ID = 'application-1'

// Minimal renderHook, as the repo renders with react-dom directly
const renderUpdateHook = () => {
  const result = {} as {
    current: ReturnType<typeof useUpdateApplication<'RECALL'>>
  }
  const Probe = () => {
    result.current = useUpdateApplication({
      id: APPLICATION_ID,
      type: 'RECALL',
    })
    return null
  }
  const root = createRoot(document.createElement('div'))
  act(() => root.render(createElement(Probe)))

  return { result, unmount: () => act(() => root.unmount()) }
}

describe('useUpdateApplication local writes', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockSaveToStorage.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('merges a quick second write into the pending one instead of dropping it', () => {
    const { result } = renderUpdateHook()

    act(() => {
      // onChange of the liquidator location, then its onBlur within 200 ms
      result.current.updateLocalOnly({
        fields: { settlementFields: { liquidatorLocation: 'Reykjavík' } },
      })
      result.current.updateLocalOnly({
        fields: {
          settlementFields: { recallRequirementStatementLocation: 'Reykjavík' },
        },
      })
      jest.advanceTimersByTime(200)
    })

    expect(mockSaveToStorage).toHaveBeenCalledTimes(1)
    expect(mockSaveToStorage).toHaveBeenCalledWith({
      fields: {
        settlementFields: {
          liquidatorLocation: 'Reykjavík',
          recallRequirementStatementLocation: 'Reykjavík',
        },
      },
    })
  })

  it('replaces arrays rather than merging them', () => {
    const { result } = renderUpdateHook()

    act(() => {
      result.current.updateLocalOnly({
        communicationChannels: [{ email: 'a@test.is' }, { email: 'b@test.is' }],
      })
      result.current.updateLocalOnly({
        communicationChannels: [{ email: 'b@test.is' }],
      })
      jest.advanceTimersByTime(200)
    })

    expect(mockSaveToStorage).toHaveBeenCalledWith({
      communicationChannels: [{ email: 'b@test.is' }],
    })
  })

  it('writes pending answers immediately when flushed before navigation', () => {
    const { result } = renderUpdateHook()

    act(() => {
      result.current.updateLocalOnly({ additionalText: 'Halló' })
    })
    expect(mockSaveToStorage).not.toHaveBeenCalled()

    flushPendingLocalWrites(APPLICATION_ID)

    expect(mockSaveToStorage).toHaveBeenCalledWith({ additionalText: 'Halló' })

    // Nothing left to write once the timer fires
    act(() => {
      jest.advanceTimersByTime(200)
    })
    expect(mockSaveToStorage).toHaveBeenCalledTimes(1)
  })

  it('writes pending answers when the field unmounts', () => {
    const { result, unmount } = renderUpdateHook()

    act(() => {
      result.current.updateLocalOnly({ additionalText: 'Bless' })
    })
    unmount()

    expect(mockSaveToStorage).toHaveBeenCalledWith({ additionalText: 'Bless' })
  })

  it('only flushes writes for the given application', () => {
    const { result } = renderUpdateHook()

    act(() => {
      result.current.updateLocalOnly({ additionalText: 'Halló' })
    })
    flushPendingLocalWrites('another-application')

    expect(mockSaveToStorage).not.toHaveBeenCalled()
  })
})
