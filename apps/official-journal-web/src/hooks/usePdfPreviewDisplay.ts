import React from 'react'

import { usePdfPreview } from './api/get/usePdfPreview'

export const useHandleOpenPdf = (id: string) => {
  const { mutate, isLoading } = usePdfPreview({ params: { id } })
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const previewPdf = async () => {
    try {
      setIsPreviewing(true)
      const pdf = await mutate()
      const res = pdf?.arrayBuffer()
      if (!res) {
        throw new Error('No PDF data available')
      }
      const blob = new Blob([await res], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setIsPreviewing(false)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setIsPreviewing(false)
    }
  }

  return {
    previewPdf,
    loading: isLoading || isPreviewing,
  }
}
