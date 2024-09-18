import { useState } from 'react'

type FetchAttachmentParams = {
  caseId: string
  attachmentId: string
}

export const useAttachments = () => {
  const [loading, setLoading] = useState(false)

  const fetchAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    return await fetch(`/api/cases/${caseId}/attachments/${attachmentId}`).then(
      (res) => {
        setLoading(false)
        return res.json()
      },
    )
  }

  const downloadAttachment = async ({
    caseId,
    attachmentId,
  }: FetchAttachmentParams) => {
    const { url } = await fetchAttachment({ caseId, attachmentId })
    const link = document.createElement('a')
    const fileName = new URL(url).pathname.split('/').pop()

    if (!fileName) return

    link.setAttribute('style', 'display: none')
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
  }

  return {
    loading,
    downloadAttachment,
  }
}
