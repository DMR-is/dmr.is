import { createContext, useCallback, useState } from 'react'

export type CaseWithPublishingNumber = {
  id: string
  publishingNumber: number
}

type PublishingStateProps = {
  selectedCaseIds: string[]
  casesWithPublishingNumber: CaseWithPublishingNumber[]
}

const publishingStateDefaults: PublishingStateProps = {
  selectedCaseIds: [],
  casesWithPublishingNumber: [],
}

type PublishingStateContext = {
  publishingState: PublishingStateProps
  addCaseToSelectedList: (id: string) => void
  removeCaseFromSelectedList: (id: string) => void
  removeAllCasesFromSelectedList: () => void
  addManyCasesToSelectedList: (ids: string[]) => void
  setCasesWithPublicationNumber: (ids: CaseWithPublishingNumber[]) => void
}

export const PublishingContext = createContext<PublishingStateContext>({
  publishingState: publishingStateDefaults,
  addCaseToSelectedList: () => null,
  removeCaseFromSelectedList: () => null,
  removeAllCasesFromSelectedList: () => null,
  addManyCasesToSelectedList: () => null,
  setCasesWithPublicationNumber: () => null,
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
          selectedCaseIds: [...state.selectedCaseIds, id],
        }))
      }
    },
    [state],
  )

  const onRemoveCase = useCallback(
    (id: string) => {
      setState((prevState) => ({
        ...prevState,
        selectedCaseIds: [
          ...prevState.selectedCaseIds.filter((caseId) => caseId !== id),
        ],
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

  const onSetCasesWithPublicationNumber = useCallback(
    (casesWithPublishingNumber: CaseWithPublishingNumber[]) => {
      setState((prevState) => ({
        ...prevState,
        casesWithPublishingNumber,
      }))
    },
    [],
  )

  return (
    <PublishingContext.Provider
      value={{
        publishingState: state,
        addCaseToSelectedList: onAddCase,
        removeCaseFromSelectedList: onRemoveCase,
        removeAllCasesFromSelectedList: onRemoveAllCases,
        addManyCasesToSelectedList: onAddManyCases,
        setCasesWithPublicationNumber: onSetCasesWithPublicationNumber,
      }}
    >
      {children}
    </PublishingContext.Provider>
  )
}
