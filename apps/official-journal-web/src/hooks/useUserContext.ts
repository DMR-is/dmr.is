import { useContext } from 'react'

import { UserContext } from '../context/userContext'

export const useUserContext = () => {
  if (!UserContext) {
    throw new Error('useMainUserContext must be used within a CaseProvider')
  }

  const { ...props } = useContext(UserContext)

  return { ...props }
}
