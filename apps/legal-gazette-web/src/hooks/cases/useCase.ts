import { useContext } from 'react'

import { CaseContext } from '../../context/case-context'

export const useCaseContext = () => {
  const caseContext = useContext(CaseContext)

  if (!caseContext) {
    throw new Error('useCase must be used within a CaseProvider')
  }

  return {
    ...caseContext,
  }
}
