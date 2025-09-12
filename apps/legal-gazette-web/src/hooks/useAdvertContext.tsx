import { useContext } from 'react'

import { AdvertContext } from '../context/advert-context'

export const useAdvertContext = () => {
  const ctx = useContext(AdvertContext)

  if (!ctx) {
    throw new Error('useAdvertContext must be used within an AdvertProvider')
  }

  return ctx
}
