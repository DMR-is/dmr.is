import { useContext } from 'react'

import { UserContext } from '../context/userContext'

export const useUserContext = () => {
  if (!UserContext) {
    throw new Error('useUserContext must be used within a UserProvider')
  }

  const userContext = useContext(UserContext)

  return { ...userContext }
}
