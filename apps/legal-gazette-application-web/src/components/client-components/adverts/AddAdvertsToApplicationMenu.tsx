'use client'

import { useState } from 'react'

import { DropdownMenu } from '@island.is/island-ui/core'

import { AddDivisionEnding } from './AddDivisionEnding'
import { AddDivisionMeeting } from './AddDivisionMeeting'
import { AddRecallAdvert } from './AddRecallAdvert'

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
            onClick: () => setRecallModalVisible(true),
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
      <AddRecallAdvert
        caseId={caseId}
        isVisible={recallModalVisible}
        onVisibilityChange={setRecallModalVisible}
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
