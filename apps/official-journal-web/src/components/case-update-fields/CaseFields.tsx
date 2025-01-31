import {
  Accordion,
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
} from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useToggle } from '../../hooks/useToggle'
import { IconButton } from '../icon-button/IconButton'
import { AdvertFields } from './AdvertFields'
import { AttachmentFields } from './AttachmentsFields'
import { CaseCorrectionFields } from './CaseCorrectionField'
import { CommentFields } from './CommentFields'
import { CommonFields } from './CommonFields'
import { MessageField } from './MessageField'
import { PublishingFields } from './PublishingFields'

export const CaseFields = () => {
  const { canEdit, isPublishedOrRejected } = useCaseContext()

  const commonToggle = useToggle(true)
  const publishingToggle = useToggle(false)
  const advertToggle = useToggle(false)
  const attachmentToggle = useToggle(false)
  const messageToggle = useToggle(false)
  const commentToggle = useToggle(false)
  const correctionToggle = useToggle(false)

  const expandAll = () => {
    commonToggle.setToggle(true)
    publishingToggle.setToggle(true)
    advertToggle.setToggle(true)
    attachmentToggle.setToggle(true)
    messageToggle.setToggle(true)
    commentToggle.setToggle(true)
    correctionToggle.setToggle(true)
  }

  const closeAll = () => {
    commonToggle.setToggle(false)
    publishingToggle.setToggle(false)
    advertToggle.setToggle(false)
    attachmentToggle.setToggle(false)
    messageToggle.setToggle(false)
    commentToggle.setToggle(false)
    correctionToggle.setToggle(false)
  }

  const isSomeOpen =
    commonToggle.toggle ||
    publishingToggle.toggle ||
    advertToggle.toggle ||
    attachmentToggle.toggle ||
    messageToggle.toggle ||
    commentToggle.toggle ||
    correctionToggle.toggle

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Stack space={2}>
            {!canEdit && (
              <AlertMessage
                type="info"
                title="Þú ert ekki skráður á málið"
                message="Aðeins starfsmenn skráðir á málið geta breytt því"
              />
            )}
            <Inline space={1} alignY="center" justifyContent="flexEnd">
              <IconButton
                size="small"
                label={isSomeOpen ? 'Loka fellilista' : 'Opna fellista'}
                icon={isSomeOpen ? 'remove' : 'add'}
                onClick={() => (isSomeOpen ? closeAll() : expandAll())}
              />
            </Inline>
            <Accordion
              dividers={true}
              dividerOnTop={false}
              dividerOnBottom={false}
              singleExpand={false}
              space={2}
            >
              <CommonFields
                toggle={commonToggle.toggle}
                onToggle={commonToggle.onToggle}
              />
              <PublishingFields
                toggle={publishingToggle.toggle}
                onToggle={publishingToggle.onToggle}
              />
              <AdvertFields
                toggle={advertToggle.toggle}
                onToggle={advertToggle.onToggle}
              />
              <AttachmentFields
                toggle={attachmentToggle.toggle}
                onToggle={attachmentToggle.onToggle}
              />
              <MessageField
                toggle={messageToggle.toggle}
                onToggle={messageToggle.onToggle}
              />
              <CommentFields
                toggle={commentToggle.toggle}
                onToggle={commentToggle.onToggle}
              />
              {isPublishedOrRejected && (
                <CaseCorrectionFields
                  toggle={correctionToggle.toggle}
                  onToggle={correctionToggle.onToggle}
                />
              )}
            </Accordion>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
