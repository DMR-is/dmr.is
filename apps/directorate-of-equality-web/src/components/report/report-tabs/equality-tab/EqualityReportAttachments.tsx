'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'

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
 * The supporting files (fylgiskjöl) a company sent with its plan — an Excel
 * action plan, say. Renders nothing when there are none, which is most reports.
 *
 * Downloads go through the `api/report-attachments` route handler, which always
 * serves them as `attachment`: these are company-supplied files and are never
 * rendered inside the admin web.
 */
export const EqualityReportAttachments = ({
  reportId,
}: EqualityReportAttachmentsProps) => {
  const trpc = useTRPC()
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
            <a
              href={`/api/report-attachments/${reportId}/${attachment.id}`}
              download
            >
              <Button
                as="span"
                variant="text"
                size="small"
                icon="download"
                iconType="outline"
              >
                {reportText.equalityTab.attachmentDownload}
              </Button>
            </a>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
