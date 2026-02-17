'use client'

import { useState } from 'react'

import { Inline } from '@dmr.is/ui/components/island-is/Inline'

import { CreateDivisionEnding } from './CreateDivisionEnding'
import { CreateDivisionMeeting } from './CreateDivisionMeeting'

export const AddAdvertsToApplicationMenu = ({
  applicationId,
  title,
}: {
  applicationId: string
  title?: string
}) => {
  const [toggleDivisionMeeting, setToggleDivisionMeeting] = useState(false)
  const [toggleDivisionEnding, setToggleDivisionEnding] = useState(false)

  return (
    <Inline space={2}>
      <CreateDivisionMeeting
        applicationId={applicationId}
        title={title}
        isVisible={toggleDivisionMeeting}
        onVisibilityChange={setToggleDivisionMeeting}
      />
      <CreateDivisionEnding applicationId={applicationId} />
    </Inline>
  )
}
