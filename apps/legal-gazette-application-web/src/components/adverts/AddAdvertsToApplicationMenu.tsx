'use client'

import { useState } from 'react'

import { DropdownMenu } from '@island.is/island-ui/core'

import { CreateDivisionEnding } from './CreateDivisionEnding'
import { CreateDivisionMeeting } from './CreateDivisionMeeting'

export const AddAdvertsToApplicationMenu = () => {
  const [toggleDivisionMeeting, setToggleDivisionMeeting] = useState(false)
  const [toggleDivisionEnding, setToggleDivisionEnding] = useState(false)

  return (
    <>
      <DropdownMenu
        title="Bæta við"
        icon="hammer"
        iconType="outline"
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
        isVisible={toggleDivisionMeeting}
        onVisibilityChange={setToggleDivisionMeeting}
      />
      <CreateDivisionEnding
        isVisible={toggleDivisionEnding}
        onVisibilityChange={setToggleDivisionEnding}
      />
    </>
  )
}
