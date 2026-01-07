'use client'

import { useState } from 'react'

import { DropdownMenu } from '@dmr.is/ui/components/island-is'

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
    <>
      <DropdownMenu
        title="Bæta við"
        icon="add"
        iconType="outline"
        openOnHover
        items={[
          {
            title: 'Skiptafundi',
            onClick: () => setToggleDivisionMeeting((prev) => !prev),
          },
          {
            title: 'Skiptalokum',
            onClick: () => setToggleDivisionEnding((prev) => !prev),
          },
        ]}
      />
      <CreateDivisionMeeting
        applicationId={applicationId}
        title={title}
        isVisible={toggleDivisionMeeting}
        onVisibilityChange={setToggleDivisionMeeting}
      />
      <CreateDivisionEnding
        applicationId={applicationId}
        title={title}
        isVisible={toggleDivisionEnding}
        onVisibilityChange={setToggleDivisionEnding}
      />
    </>
  )
}
