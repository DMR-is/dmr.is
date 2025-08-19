'use client'

import { useState } from 'react'

import { DropdownMenu } from '@island.is/island-ui/core'

import { AddDivisionEnding } from './AddDivisionEnding'
import { AddDivisionMeeting } from './AddDivisionMeeting'

type Props = {
  caseId: string
}

export const AddAdvertsToApplicationMenu = ({ caseId }: Props) => {
  const [divisionMeetingModalVisible, setDivisionMeetingModalVisible] =
    useState(false)
  const [recallModalVisible, setRecallModalVisible] = useState(false)
  const [divisionEndingModalVisible, setDivisionEndingModalVisible] =
    useState(false)

  const handleVisibilityChange = (isVisible: boolean) => {
    setDivisionMeetingModalVisible(isVisible)
  }

  return (
    <>
      <DropdownMenu
        title="Bæta við"
        icon="hammer"
        iconType="outline"
        items={[
          {
            title: 'Innköllun',
            onClick: () => console.log('Creating recall advert'),
          },
          {
            title: 'Skiptafundi',
            onClick: () => setDivisionMeetingModalVisible(true),
          },
          {
            title: 'Skiptalokum',
            onClick: () => setDivisionEndingModalVisible(true),
          },
        ]}
      />
      <AddDivisionMeeting
        caseId={caseId}
        isVisible={divisionMeetingModalVisible}
        onVisibilityChange={handleVisibilityChange}
      />
      <AddDivisionEnding
        caseId={caseId}
        isVisible={divisionEndingModalVisible}
        onVisibilityChange={setDivisionEndingModalVisible}
      />
    </>
  )
}
