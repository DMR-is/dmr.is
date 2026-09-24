import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'

import { sharedText } from '../lib/text'

/** Loading and error bodies for a tab, so each tab reads the same. */
export const TabLoading = () => (
  <Box marginTop={4}>
    <SkeletonLoader repeat={2} height={96} space={2} />
  </Box>
)

export const TabError = ({ message }: { message: string }) => (
  <Box marginTop={4}>
    <AlertMessage
      type="error"
      title={sharedText.loadErrorTitle}
      message={message}
    />
  </Box>
)

/** Toast text for a failed mutation, with the API's Icelandic reason when it
 *  sent one. */
export const withReason = (
  base: string,
  error: { data?: { translatedMessage?: string } | null },
) => {
  const reason = error.data?.translatedMessage
  return reason ? `${base} - ${reason}` : base
}
