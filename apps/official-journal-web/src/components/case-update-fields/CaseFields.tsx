import { useState } from 'react'

import {
  Accordion,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { Department } from '../../gen/fetch'
import { AdvertFields } from './AdvertFields'
import { AttachmentFields } from './AttachmentsFields'
import { CommentFields } from './CommentFields'
import { CommonFields } from './CommonFields'
import { PublishingFields } from './PublishingFields'

type Props = {
  expanded?: boolean
  departments: Department[]
}

export const CaseFields = ({ departments }: Props) => {
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
              <CommonFields departments={departments} />
              <PublishingFields />
              <AdvertFields />
              <AttachmentFields />
              <CommentFields />
            </Accordion>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
