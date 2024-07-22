import { createContext, useState } from 'react'

type PublishingContextProps = {
  selectedCaseIds: string[]
  addCaseToSelectedList: (caseId: string) => void
  removeCaseFromSelectedList: (caseId: string) => void
  removeAllCasesFromSelectedList: () => void
  addManyCasesToSelectedList: (caseIds: string[]) => void
}

export const PublishingContext = createContext<PublishingContextProps>({
  selectedCaseIds: [],
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
  const onAddCase = (id: string) => {
    if (!state.selectedCaseIds.includes(id)) {
      setState((prevState) => ({
        ...prevState,
        selectedCaseIds: [...prevState.selectedCaseIds, id],
      }))
    }
  }

  const onRemoveCase = (id: string) => {
    setState((prevState) => ({
      ...prevState,
      selectedCaseIds: prevState.selectedCaseIds.filter(
        (caseId) => caseId !== id,
      ),
    }))
  }

  const onRemoveAllCases = () => {
    setState((prevState) => ({ ...prevState, selectedCaseIds: [] }))
  }

  const onAddManyCases = (ids: string[]) => {
    const uniqueIds = ids.filter((id) => !state.selectedCaseIds.includes(id))
    setState((prevState) => ({
      ...prevState,
      selectedCaseIds: [...state.selectedCaseIds, ...uniqueIds],
    }))
  }

  const initalState = {
    selectedCaseIds: [],
    addCaseToSelectedList: onAddCase,
    removeCaseFromSelectedList: onRemoveCase,
    removeAllCasesFromSelectedList: onRemoveAllCases,
    addManyCasesToSelectedList: onAddManyCases,
  } as PublishingContextProps

  const [state, setState] = useState(initalState)

  return (
    <PublishingContext.Provider value={state}>
      {children}
    </PublishingContext.Provider>
  )
}
