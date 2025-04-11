import { useSession } from 'next-auth/react'
import { useState } from 'react'

import { toast } from '@island.is/island-ui/core'

import { getDmrClient } from '../../../lib/api/createClient'
type UploadAdvertPDFParams = {
  advertId: string
  file: File
}

export const useUpdateAdvertPDF = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const uploadPDF = async ({ advertId, file }: UploadAdvertPDFParams) => {
    setLoading(true)
    setError(null)

    try {
      const fileExtension = file.name.split('.').pop()

      if (!fileExtension) {
        throw new Error('File extension not found')
      }

      const res = await dmrClient.AdvertPDFReplacement({
        file,
        id: advertId,
      })

      const didUpload = await fetch(res.url, {
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        method: 'PUT',
        body: file,
      })

      if (!didUpload.ok) {
        setError(`Ekki tókst að hlaða upp skjali í gagnageymslu S3`)
        setLoading(false)
        return
      }

      setLoading(false)
    } catch (error) {
      setLoading(false)
      setError('Ekki tókst að hlaða upp skjali í gagnageymslu')
      toast.error('Ekki tókst að hlaða upp skjali í gagnageymslu', {
        toastId: 'uploadAttachmentError',
      })
    }
  }

  return {
    loading,
    uploadPDF,
    error,
  }
}
