import { useContext } from 'react'

import { PublishingContext } from '../context/publishingContext'

export const usePublishContext = () => {
  const context = useContext(PublishingContext)

  if (!context) {
    throw new Error('usePublishContext must be used within a FilterProvider')
  }

  return context
}
