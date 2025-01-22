import { useState } from 'react'

import {
  Accordion,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { AdvertFields } from './AdvertFields'
import { AttachmentFields } from './AttachmentsFields'
import { CommentFields } from './CommentFields'
import { CommonFields } from './CommonFields'
import { MessageField } from './MessageField'
import { PublishingFields } from './PublishingFields'

export const CaseFields = () => {
  const [expandAll, setExpandAll] = useState(false)

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Stack space={2}>
            <Accordion
              dividers={true}
              dividerOnTop={false}
              dividerOnBottom={false}
              singleExpand={false}
              space={2}
            >
              <CommonFields />
              <PublishingFields />
              <AdvertFields />
              <AttachmentFields />
              <MessageField />
              <CommentFields />
            </Accordion>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
