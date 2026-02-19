'use client'

import { Inline } from '@dmr.is/ui/components/island-is/Inline'

import { CreateDivisionEnding } from './CreateDivisionEnding'
import { CreateDivisionMeeting } from './CreateDivisionMeeting'

export const AddAdvertsToApplicationMenu = ({
  applicationId,
}: {
  applicationId: string
}) => {
  return (
    <Inline space={2}>
      <CreateDivisionMeeting applicationId={applicationId} />
      <CreateDivisionEnding applicationId={applicationId} />
    </Inline>
  )
}
