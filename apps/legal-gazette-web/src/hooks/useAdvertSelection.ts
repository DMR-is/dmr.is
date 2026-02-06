'use client'

import { useCallback, useState } from 'react'

/**
 * Shared hook for managing advert selection state in table components
 */
export const useAdvertSelection = (totalCount: number | undefined) => {
  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])

  const toggleAllAdverts = useCallback(
    (adverts: Array<{ id: string }> | undefined) => {
      setSelectedAdvertIds((prev) =>
        prev.length === totalCount && totalCount > 0
          ? []
          : adverts?.map((ad) => ad.id) || [],
      )
    },
    [totalCount],
  )

  const handleAdvertSelect = useCallback((advertId: string, checked: boolean) => {
    if (checked) {
      setSelectedAdvertIds((prev) => [...prev, advertId])
    } else {
      setSelectedAdvertIds((prev) => prev.filter((id) => id !== advertId))
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedAdvertIds([])
  }, [])

  return {
    selectedAdvertIds,
    toggleAllAdverts,
    handleAdvertSelect,
    clearSelection,
  }
}
