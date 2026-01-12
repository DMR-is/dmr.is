'use client'

import { useState } from 'react'

import { Button, DropdownMenu } from '@dmr.is/ui/components/island-is'

import { Inline } from '@island.is/island-ui/core'

import { CreateDivisionEnding } from './CreateDivisionEnding'
import { CreateDivisionMeeting } from './CreateDivisionMeeting'

export const AddAdvertsToApplicationMenu = ({
  applicationId,
  title,
  asButtons,
}: {
  applicationId: string
  title?: string
  asButtons?: boolean
}) => {
  const [toggleDivisionMeeting, setToggleDivisionMeeting] = useState(false)
  const [toggleDivisionEnding, setToggleDivisionEnding] = useState(false)

  return (
    <>
      {asButtons ? (
        <Inline space={2}>
          <Button
            onClick={() => setToggleDivisionMeeting((prev) => !prev)}
            variant="utility"
            size="small"
            icon="add"
          >
            Skiptafundur
          </Button>
          <Button
            onClick={() => setToggleDivisionEnding((prev) => !prev)}
            variant="utility"
            size="small"
            icon="add"
          >
            Skiptalok
          </Button>
        </Inline>
      ) : (
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
      )}
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
