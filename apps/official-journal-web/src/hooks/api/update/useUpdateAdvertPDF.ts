import router from 'next/router'
import { useSession } from 'next-auth/react'

import { useState } from 'react'

import { toast } from '@island.is/island-ui/core'

import { getDmrClient } from '../../../lib/api/createClient'
import { Routes } from '../../../lib/constants'
type UploadAdvertPDFParams = {
  advertId: string
  file: File
  advertName?: string
}

export const useUpdateAdvertPDF = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const uploadPDF = async ({
    advertId,
    file,
    advertName,
  }: UploadAdvertPDFParams) => {
    setLoading(true)
    setError(null)

    try {
      const fileExtension = file.name.split('.').pop()

      if (!fileExtension) {
        throw new Error('File extension not found')
      }

      await dmrClient
        .advertPDFReplacement({
          id: advertId,
          file: file,
        })
        .then(() => {
          toast.success('Skjali hlaðið upp í gagnageymslu S3', {
            toastId: 'uploadAttachment',
          })
          setLoading(false)
          router.push(`${Routes.ReplacePdf}?search=${advertName}`)
        })
        .catch((error) => {
          setError(`Ekki tókst að hlaða upp skjali í gagnageymslu S3`)
          setLoading(false)
          toast.error('Ekki tókst að hlaða upp skjali í gagnageymslu', {
            toastId: 'uploadAttachment',
          })
        })
    } catch (error) {
      setError(`Ekki tókst að hlaða upp skjali`)
      setLoading(false)
    }
  }

  return {
    loading,
    uploadPDF,
    error,
  }
}
