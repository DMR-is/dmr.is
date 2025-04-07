import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { z } from 'zod'

import { toast } from '@island.is/island-ui/core'

import { AddApplicationAttachmentTypeEnum } from '../gen/fetch'
import { getDmrClient } from '../lib/api/createClient'
import { ADDITIONAL_DOCUMENTS } from '../lib/constants'
import { overrideAttachmentSchema } from '../lib/types'

type FetchAttachmentParams = {
  caseId: string
  attachmentId: string
}

type UploadAttachmentParams = {
  caseId: string
  file: File
}

export const useAttachments = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useSession()
  const dmrClient = getDmrClient(session?.idToken as string)

  const fetchAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    return await dmrClient.getCaseAttachment({ caseId, attachmentId })
  }

  const uploadAttachment = async ({ caseId, file }: UploadAttachmentParams) => {
    setLoading(true)
    setError(null)

    try {
      const fileExtension = file.name.split('.').pop()

      if (!fileExtension) {
        throw new Error('File extension not found')
      }

      const key = `applications/${caseId}/${ADDITIONAL_DOCUMENTS}/${file.name}`

      const res = await dmrClient.addApplicationAttachment({
        postApplicationAttachmentBody: {
          fileExtension: fileExtension,
          fileFormat: file.type,
          fileLocation: key,
          fileName: file.name,
          fileSize: file.size,
          originalFileName: file.name,
        },
        id: caseId,
        type: ADDITIONAL_DOCUMENTS as AddApplicationAttachmentTypeEnum,
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

  const downloadAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    setLoading(true)
    setError(null)
    const response = await fetchAttachment({ caseId, attachmentId })

    const { url, key } = response

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          toast.error('Ekki tókst að sækja skjal úr gagnageymslu', {
            toastId: 'donloadAttachmentError',
          })
          throw new Error('Ekki tókst að sækja skjal úr gagnageymslu')
        }
        return response.blob()
      })
      .then((blob) => {
        const fileName = key?.split('/').pop() || 'downloaded.pdf'
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const overwriteAttachment = async ({
    caseId,
    attachmentId,
    file,
    applicationId,
    onSuccess,
  }: FetchAttachmentParams & {
    applicationId: string
    file: File
    onSuccess?: () => void
  }) => {
    setLoading(true)
    setError(null)
    const fileExtension = file.name.split('.').pop()

    if (!fileExtension) {
      throw new Error('File extension not found')
    }

    // we know for certain that only additonal documents (not original) are allowed for override
    const key = `applications/${applicationId}/${ADDITIONAL_DOCUMENTS}/${file.name}`

    const body: z.infer<typeof overrideAttachmentSchema> = {
      fileExtension: fileExtension,
      fileFormat: file.type,
      fileLocation: key,
      fileName: file.name,
      fileSize: file.size,
      originalFileName: file.name,
    }

    const response = await dmrClient.overwriteCaseAttachment({
      caseId: caseId,
      attachmentId: attachmentId,
      postApplicationAttachmentBody: body,
    })
    const { url } = response

    if (!url) return

    // upload the new attachment to s3
    const didUpload = await fetch(url, {
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

    onSuccess && onSuccess()
  }

  return {
    loading,
    downloadAttachment,
    overwriteAttachment,
    uploadAttachment,
    error,
  }
}
