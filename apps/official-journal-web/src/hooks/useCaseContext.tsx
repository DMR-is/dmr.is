import { useContext } from 'react'

import { CaseContext } from '../context/caseContext'

export const useCaseContext = () => {
  if (!CaseContext) {
    throw new Error('useCaseContext must be used within a CaseProvider')
  }

  const { ...props } = useContext(CaseContext)

  return { ...props }
}
