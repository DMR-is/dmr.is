/** @jest-environment jsdom */
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { PriceCalculator } from './calculator'

jest.mock('@dmr.is/trpc/client/trpc', () => ({ useQuery: jest.fn() }))
jest.mock('next-auth/react', () => ({ useSession: () => ({ data: {} }) }))
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: jest.fn() }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}))
jest.mock('../../lib/trpc/client/trpc', () => ({
  useTRPC: () => ({
    getPaymentStatus: { queryOptions: () => ({ queryKey: ['payment'] }) },
    updatePrice: { mutationOptions: () => ({}) },
  }),
}))
const mockCaseContext = {
  currentCase: {
    id: 'case-id',
    advertDepartment: { slug: 'c-deild' },
    transaction: { price: 100 },
  },
  canEdit: true,
  feeCodeOptions: [],
  isPublishedOrRejected: true,
}
jest.mock('../../hooks/useCaseContext', () => ({
  useCaseContext: () => mockCaseContext,
}))
jest.mock('./calculatorContext', () => ({
  usePriceCalculatorState: () => ({ state: {}, dispatch: jest.fn() }),
}))
jest.mock('../../lib/api/createClient', () => ({ getDmrClient: () => ({}) }))
jest.mock('../../lib/utils', () => ({ imageTiers: [] }))
jest.mock('./Calculator.css', () => ({}))
jest.mock('@dmr.is/ui/hooks/useBreakpoint', () => ({
  useBreakpoint: () => ({ md: true }),
}))
jest.mock('@dmr.is/ui/components/island-is/ToastContainer', () => ({
  toast: {},
}))
jest.mock('@dmr.is/ui/components/island-is/Box', () => ({
  Box: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))
jest.mock('@dmr.is/ui/components/island-is/Inline', () => ({
  Inline: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))
jest.mock('@dmr.is/ui/components/island-is/Stack', () => ({
  Stack: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))
jest.mock('@dmr.is/ui/components/island-is/Text', () => ({
  Text: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}))
jest.mock('@dmr.is/ui/components/island-is/Button', () => ({
  Button: ({ children, onClick, disabled }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))
jest.mock('@dmr.is/ui/components/island-is/Checkbox', () => ({
  Checkbox: () => null,
}))
jest.mock('../select/OJOIInput', () => ({ OJOIInput: () => null }))
jest.mock('../select/OJOISelect', () => ({ OJOISelect: () => null }))
jest.mock('./StatusBox', () => ({
  PriceCalculatorStatusBox: ({ text }: { text: string }) => <span>{text}</span>,
}))

describe('payment status display', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    container = document.createElement('div')
    root = createRoot(container)
    mockCaseContext.isPublishedOrRejected = true
  })
  afterEach(() => {
    act(() => root.unmount())
  })
  const render = () => act(() => root.render(<PriceCalculator />))
  const button = (name: string) =>
    Array.from(container.querySelectorAll('button')).find(
      (el) => el.textContent === name,
    )

  const refetch = jest.fn()
  const setQuery = (overrides: Record<string, unknown>) => {
    jest.mocked(useQuery).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch,
      ...overrides,
    } as unknown as ReturnType<typeof useQuery>)
  }

  it('shows loading without claiming the payment is unpaid or offering to send it', () => {
    setQuery({ isPending: true, isFetching: true })
    render()
    expect(container.textContent).toContain('Sæki greiðslustöðu…')
    expect(container.textContent).not.toContain('Ekki búið að greiða')
    expect(button('Senda til TBR')).toBeUndefined()
  })

  it('shows an error and manual retry when nothing is cached', () => {
    setQuery({ isError: true })
    render()
    expect(container.textContent).toContain(
      'Ekki tókst að sækja greiðslustöðu.',
    )
    expect(container.textContent).not.toContain('Ekki búið að greiða')
    expect(button('Senda til TBR')).toBeUndefined()
    act(() => button('Reyna aftur')?.click())
    expect(refetch).toHaveBeenCalledTimes(1)
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({ retry: false }),
    )
  })

  it.each([
    [{ paid: false, created: false }, 'Ekki búið að greiða'],
    [{ paid: true, created: true }, 'Búið er að greiða'],
  ])(
    'keeps showing cached status %s behind a staleness warning when a refetch fails',
    (data, status) => {
      setQuery({ isError: true, data })
      render()
      expect(container.textContent).toContain(status)
      expect(container.textContent).toContain(
        'Ekki tókst að uppfæra greiðslustöðu, staðan gæti verið úrelt.',
      )
      expect(container.textContent).not.toContain(
        'Ekki tókst að sækja greiðslustöðu.',
      )
      act(() => button('Reyna aftur')?.click())
      expect(refetch).toHaveBeenCalledTimes(1)
    },
  )

  it('does not offer sending to TBR while the cached status is stale', () => {
    setQuery({ isError: true, data: { paid: false, created: false } })
    render()
    expect(button('Senda til TBR')?.disabled).toBe(true)
  })

  it('restores the confirmed status after a successful retry', () => {
    setQuery({ isError: true })
    render()
    setQuery({ data: { paid: true, created: true } })
    render()
    expect(container.textContent).toContain('Búið er að greiða')
    expect(container.textContent).not.toContain(
      'Ekki tókst að sækja greiðslustöðu.',
    )
    expect(container.textContent).not.toContain(
      'Ekki tókst að uppfæra greiðslustöðu',
    )
  })

  it('offers sending to TBR only after a successful missing-payment response', () => {
    setQuery({ data: { paid: false, created: false } })
    render()
    expect(container.textContent).toContain('Ekki búið að greiða')
    expect(button('Senda til TBR')?.disabled).toBe(false)
  })

  describe('before the case is published or rejected', () => {
    beforeEach(() => {
      mockCaseContext.isPublishedOrRejected = false
    })

    it.each([
      ['loading', { isPending: true, isFetching: true }],
      ['failing', { isError: true }],
    ])(
      'keeps the informational line while the payment lookup is %s',
      (_, query) => {
        setQuery(query)
        render()
        expect(container.textContent).toContain(
          'Auglýsing verður send til TBR við staðfestingu á útgáfu.',
        )
        expect(container.textContent).not.toContain('Sæki greiðslustöðu…')
        expect(container.textContent).not.toContain(
          'Ekki tókst að sækja greiðslustöðu.',
        )
        expect(button('Reyna aftur')).toBeUndefined()
      },
    )
  })
})
