import { useState } from 'react'
import { z } from 'zod'

import { ADDITIONAL_DOCUMENTS } from '../lib/constants'
import { overrideAttachmentSchema } from '../lib/types'

type FetchAttachmentParams = {
  caseId: string
  attachmentId: string
}

export const useAttachments = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    return await fetch(`/api/cases/${caseId}/attachments/${attachmentId}`)
  }

  const downloadAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    setLoading(true)
    setError(null)
    const response = await fetchAttachment({ caseId, attachmentId })

    if (!response.ok) {
      setError(`Ekki tókst að sækja skjal`)
      setLoading(false)
      return
    }

    const json = await response.json()
    const { url } = json

    const link = document.createElement('a')

    const fileName = new URL(url).pathname.split('/').pop()

    if (!fileName) return

    link.setAttribute('style', 'display: none')
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
    setLoading(false)
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

    // here we create a database record for the attachment and get a signed url for the override
    const response = await fetch(
      `/api/cases/${caseId}/attachments/${attachmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      setError(`Ekki tókst vista skjal í gagnageymslu`)
      setLoading(false)
      return
    }

    const json = await response.json()
    const { url } = json

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
    error,
  }
}