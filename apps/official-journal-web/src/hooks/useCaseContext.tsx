import { useContext } from 'react'

import { CaseContext } from '../context/caseContext'

export const useCaseContext = () => {
  if (!CaseContext) {
    throw new Error('useCaseContext must be used within a CaseProvider')
  }

  const { currentCase, refetch, isLoading, isValidating, error } =
    useContext(CaseContext)

  return { currentCase, refetch, isLoading, isValidating, error }
}
