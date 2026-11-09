'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { AlertMessage, Button, Stack, Text } from '@island.is/island-ui/core'

import { reportText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

type EqualityReportAttachmentsProps = {
  /** The equality report whose fylgiskjöl to list. */
  reportId: string
}

const formatSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString('is-IS', {
        maximumFractionDigits: 1,
      })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * Fetches the file and hands it to the browser as a download.
 *
 * Not a plain `<a download>`: that sends a 401 (expired session), 404 or 504
 * straight to the browser's download manager, which presents it as a broken
 * file. Fetching first lets the route handler's own Icelandic message reach the
 * reviewer. The file is at most 4 MB, so holding it as a blob is fine.
 */
const downloadAttachment = async (
  href: string,
  filename: string,
): Promise<void> => {
  const res = await fetch(href)

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error ?? reportText.equalityTab.attachmentsError)
  }

  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * The supporting files (fylgiskjöl) a company sent with its plan — an Excel
 * action plan, say. Renders nothing when there are none, which is most reports.
 *
 * Downloads go through the `api/report-attachments` route handler, which always
 * serves them as `attachment`, and are saved via a blob — these are
 * company-supplied files and are never rendered inside the admin web.
 */
export const EqualityReportAttachments = ({
  reportId,
}: EqualityReportAttachmentsProps) => {
  const trpc = useTRPC()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { data, isError } = useQuery(
    trpc.reports.getAttachments.queryOptions({ id: reportId }),
  )

  if (isError) {
    return (
      <Box marginBottom={4}>
        <AlertMessage
          type="warning"
          message={reportText.equalityTab.attachmentsError}
        />
      </Box>
    )
  }

  const attachments = data?.attachments ?? []

  if (attachments.length === 0) {
    return null
  }

  return (
    <Box marginBottom={4}>
      <Text variant="h4" marginBottom={2}>
        {reportText.equalityTab.attachmentsTitle}
      </Text>
      <Stack space={1}>
        {attachments.map((attachment) => (
          <Box
            key={attachment.id}
            display="flex"
            justifyContent="spaceBetween"
            alignItems="center"
            border="standard"
            borderRadius="large"
            paddingX={3}
            paddingY={2}
          >
            <Box>
              <Text variant="medium" fontWeight="semiBold">
                {attachment.filename}
              </Text>
              <Text variant="small">{formatSize(attachment.sizeBytes)}</Text>
            </Box>
            <Button
              variant="text"
              size="small"
              icon="download"
              iconType="outline"
              loading={downloadingId === attachment.id}
              disabled={downloadingId !== null}
              onClick={async () => {
                setDownloadingId(attachment.id)
                try {
                  await downloadAttachment(
                    `/api/report-attachments/${reportId}/${attachment.id}`,
                    attachment.filename,
                  )
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : reportText.equalityTab.attachmentsError,
                    { autoClose: 5000 },
                  )
                } finally {
                  setDownloadingId(null)
                }
              }}
            >
              {reportText.equalityTab.attachmentDownload}
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
