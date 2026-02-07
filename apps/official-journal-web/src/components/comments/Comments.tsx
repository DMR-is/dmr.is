import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useCaseContext } from '../../hooks/useCaseContext'
import { Tabs } from '../tabs/Tabs'
import { AddCommentTab } from './AddCommentTab'
import { CommentList } from './CommentList'

enum AddCommentTabs {
  INTERNAL = 'addInternalComment',
  EXTERNAL = 'addExternalComment',
}

export const Comments = () => {
  const { currentCase } = useCaseContext()
  const [selectedTab, setSelectedTab] = useState(AddCommentTabs.INTERNAL)
  const addCommentsTabs = [
    {
      id: AddCommentTabs.INTERNAL,
      label: 'Innri athugasemdir',
      content: <AddCommentTab internal placeholder="Bæta við skilaboðum" />,
    },
  ]

  if (currentCase.applicationId) {
    addCommentsTabs.push({
      id: AddCommentTabs.EXTERNAL,
      label: 'Skilaboð til auglýsanda',
      content: (
        <AddCommentTab
          internal={false}
          placeholder="Bæta við athugasemd (sýnilegt auglýsanda)"
        />
      ),
    })
  }

  return (
    <Box
      borderRadius="large"
      paddingTop={0}
      padding={[2, 3, 5]}
      background="blue100"
    >
      <Stack space={[2, 2, 3]}>
        <CommentList />
        <Box background="white" padding={[2, 2, 3]} paddingBottom={0}>
          {addCommentsTabs.length > 1 ? (
            <Tabs
              tabs={addCommentsTabs}
              selectedTab={selectedTab}
              onTabChange={(id) => setSelectedTab(id as AddCommentTabs)}
              label={''}
            />
          ) : (
            <AddCommentTab internal placeholder="Bæta við skilaboðum" />
          )}
        </Box>
      </Stack>
    </Box>
  )
}
