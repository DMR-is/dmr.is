import { useContext } from 'react'

import { CategoryContext } from '../context/mainCategoryContext'

export const useCategoryContext = () => {
  if (!CategoryContext) {
    throw new Error('useMainCategoryContext must be used within a CaseProvider')
  }

  const { ...props } = useContext(CategoryContext)

  return { ...props }
}
