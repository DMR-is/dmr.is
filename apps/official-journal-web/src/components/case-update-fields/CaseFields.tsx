import { Accordion } from '@dmr.is/ui/components/island-is/Accordion'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useToggle } from '../../hooks/useToggle'
import { AdvertPreview } from '../advert-display/AdvertPreview'
import { IconButton } from '../icon-button/IconButton'
import { AdvertFields } from './AdvertFields'
import { AppendixFields } from './AppendixFields'
import { AttachmentFields } from './AttachmentsFields'
import { CaseCorrectionFields } from './CaseCorrectionField'
import { CommentFields } from './CommentFields'
import { CommonFields } from './CommonFields'
import { CommunicationChannelsField } from './CommunicationChannelsField'
import { MessageField } from './MessageField'
import { PublishingFields } from './PublishingFields'
import { SignatureFields } from './SignatureFields'

export const CaseFields = () => {
  const { canEdit, isPublishedOrRejected, currentCase } = useCaseContext()

  const commonToggle = useToggle(true)
  const publishingToggle = useToggle(false)
  const advertToggle = useToggle(false)
  const signatureToggle = useToggle(false)
  const attachmentToggle = useToggle(false)
  const messageToggle = useToggle(false)
  const commentToggle = useToggle(false)
  const correctionToggle = useToggle(false)
  const communicationChannelsToggle = useToggle(false)
  const appendixToggle = useToggle(false)

  const toggles = [
    commonToggle,
    publishingToggle,
    advertToggle,
    signatureToggle,
    attachmentToggle,
    messageToggle,
    commentToggle,
    correctionToggle,
    communicationChannelsToggle,
    appendixToggle,
  ]

  const expandAll = () => {
    toggles.forEach((toggle) => toggle.setToggle(true))
  }

  const closeAll = () => {
    toggles.forEach((toggle) => toggle.setToggle(false))
  }

  const isSomeOpen = toggles.some((toggle) => toggle.toggle)

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
            <Inline space={1} alignY="center" justifyContent="spaceBetween">
              <AdvertPreview
                disclosure={
                  <Button
                    variant="utility"
                    size="small"
                    icon="open"
                    iconType="outline"
                  >
                    Skoða mál
                  </Button>
                }
              />
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
              <SignatureFields
                toggle={signatureToggle.toggle}
                onToggle={signatureToggle.onToggle}
              />
              {!currentCase?.isLegacy && (
                <>
                  <AppendixFields
                    toggle={appendixToggle.toggle}
                    onToggle={appendixToggle.onToggle}
                  />
                  <AttachmentFields
                    toggle={attachmentToggle.toggle}
                    onToggle={attachmentToggle.onToggle}
                  />
                  <CommunicationChannelsField
                    toggle={communicationChannelsToggle.toggle}
                    onToggle={communicationChannelsToggle.onToggle}
                  />
                  <MessageField
                    toggle={messageToggle.toggle}
                    onToggle={messageToggle.onToggle}
                  />
                </>
              )}
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
