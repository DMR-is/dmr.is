import { createContext, useCallback, useState } from 'react'

type PublishingStateProps = {
  selectedCaseIds: string[]
}

const publishingStateDefaults: PublishingStateProps = {
  selectedCaseIds: [],
}

type PublishingStateContext = {
  publishingState: PublishingStateProps
  addCaseToSelectedList: (id: string) => void
  removeCaseFromSelectedList: (id: string) => void
  removeAllCasesFromSelectedList: () => void
  addManyCasesToSelectedList: (ids: string[]) => void
}

export const PublishingContext = createContext<PublishingStateContext>({
  publishingState: publishingStateDefaults,
  addCaseToSelectedList: () => {},
  removeCaseFromSelectedList: () => {},
  removeAllCasesFromSelectedList: () => {},
  addManyCasesToSelectedList: () => {},
})

export const PublishingContextProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [state, setState] = useState<PublishingStateProps>(
    publishingStateDefaults,
  )

  const onAddCase = useCallback(
    (id: string) => {
      if (!state.selectedCaseIds.includes(id)) {
        setState((prevState) => ({
          ...prevState,
          selectedCaseIds: [...prevState.selectedCaseIds, id],
        }))
      }
    },
    [state],
  )

  const onRemoveCase = useCallback(
    (id: string) => {
      setState((prevState) => ({
        ...prevState,
        selectedCaseIds: prevState.selectedCaseIds.filter(
          (caseId) => caseId !== id,
        ),
      }))
    },
    [state],
  )

  const onRemoveAllCases = useCallback(() => {
    setState((prevState) => ({ ...prevState, selectedCaseIds: [] }))
  }, [state])

  const onAddManyCases = useCallback(
    (ids: string[]) => {
      const uniqueIds = ids.filter((id) => !state.selectedCaseIds.includes(id))
      setState((prevState) => ({
        ...prevState,
        selectedCaseIds: [...state.selectedCaseIds, ...uniqueIds],
      }))
    },
    [state],
  )

  return (
    <PublishingContext.Provider
      value={{
        publishingState: state,
        addCaseToSelectedList: onAddCase,
        removeCaseFromSelectedList: onRemoveCase,
        removeAllCasesFromSelectedList: onRemoveAllCases,
        addManyCasesToSelectedList: onAddManyCases,
      }}
    >
      {children}
    </PublishingContext.Provider>
  )
}
