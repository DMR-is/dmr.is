'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { HTMLEditor } from '@dmr.is/ui/components/Editor/Editor'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { reportText } from '../../../lib/text'
import { useTRPC } from '../../../lib/trpc/client/trpc'

const t = reportText.timeline

type Props = {
  companyEmailId: string
}

/**
 * The "Sjá tölvupóst" toggle on a CUSTOM_EMAIL_* timeline entry.
 *
 * ⚠️ The fetch is gated on `isOpen`, not merely rendered lazily. Every recipient
 * of a batch gets one of these entries, so a timeline showing several would
 * otherwise fire a request per entry for the same message on first paint. React
 * Query dedupes the identical key, but the toggle is what keeps a closed entry
 * from asking at all.
 */
export const CompanyEmailDetail = ({ companyEmailId }: Props) => {
  const trpc = useTRPC()
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading, isError } = useQuery(
    trpc.companyEmail.get.queryOptions(
      { id: companyEmailId },
      {
        enabled: isOpen,
        // A sent message never changes, so once it is here it is here.
        staleTime: Infinity,
      },
    ),
  )

  return (
    <Box marginTop={1}>
      <Button
        variant="text"
        size="small"
        icon={isOpen ? 'chevronUp' : 'chevronDown'}
        iconType="outline"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        {isOpen ? t.customEmailHide : t.customEmailShow}
      </Button>

      {isOpen && (
        <Box
          marginTop={1}
          padding={2}
          background="white"
          borderRadius="large"
          border="standard"
        >
          {isLoading && <SkeletonLoader repeat={3} height={20} space={1} />}

          {isError && (
            <Text variant="small" color="red600">
              {t.customEmailError}
            </Text>
          )}

          {data && (
            <>
              <Text variant="eyebrow" color="dark400">
                {t.customEmailSubject}
              </Text>
              <Text fontWeight="semiBold" marginBottom={2}>
                {data.subject}
              </Text>

              {/*
                Rendered through the editor in read-only mode, the same way
                `EqualityReportTab` renders a stored report body. Not
                `dangerouslySetInnerHTML`: the HTML was sanitised once on the way
                in, and keeping the render path identical to the rest of the app
                means there is one place where stored HTML meets the DOM.
              */}
              <HTMLEditor
                readonly
                disabled
                defaultValue={data.bodyHtml}
                handleUpload={() => new Error('File upload not supported')}
              />

              {/*
                Part of the record of what went out: one copy of this message
                also went to this address, which is not a recipient of the batch
                and therefore appears on no company's timeline.
              */}
              {!!data.copyToEmail && (
                <Box marginTop={2}>
                  <Text variant="eyebrow" color="dark400">
                    {t.customEmailCopyTo}
                  </Text>
                  <Text variant="small">{data.copyToEmail}</Text>
                </Box>
              )}

              {data.attachments.length > 0 && (
                <Box marginTop={2}>
                  <Text variant="eyebrow" color="dark400">
                    {t.customEmailAttachments}
                  </Text>
                  {data.attachments.map((attachment) => (
                    <Text key={attachment.id} variant="small">
                      {attachment.filename}
                    </Text>
                  ))}
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  )
}
