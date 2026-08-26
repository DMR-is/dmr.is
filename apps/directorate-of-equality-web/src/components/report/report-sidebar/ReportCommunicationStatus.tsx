'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Input } from '@dmr.is/ui/components/island-is/Input'

import { CommunicationStatusEnum } from '../../../gen/fetch'
import { CommunicationStatusTranslatedEnum } from '../../../lib/constants'
import { reportText } from '../../../lib/text'

const t = reportText.communicationStatus

type Props = {
  communicationStatus: CommunicationStatusEnum
}

/**
 * Read-only. The status is a projection of what has happened on the thread —
 * the reviewer moves it by writing a comment visible to the applicant (in the
 * comments tab), never by setting it here.
 */
export const ReportCommunicationStatus = ({ communicationStatus }: Props) => (
  <Box background="white" borderRadius="large">
    <Input
      name="report-communication-status"
      readOnly
      value={CommunicationStatusTranslatedEnum[communicationStatus]}
      size="sm"
      label={t.label}
    />
  </Box>
)
