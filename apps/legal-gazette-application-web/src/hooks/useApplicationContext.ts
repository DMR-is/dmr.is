import { useContext } from 'react'

import { ApplicationContext } from '../context/applicationContext'

export const useApplicationContext = () => {
  const context = useContext(ApplicationContext)

  if (!context) {
    throw new Error(
      'useApplicationContext must be used within an ApplicationProvider',
    )
  }

  return context
}
