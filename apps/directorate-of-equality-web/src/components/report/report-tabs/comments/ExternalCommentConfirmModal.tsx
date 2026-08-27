'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { reportText } from '../../../../lib/text'
import * as styles from '../../report-sidebar/ReportDenialModal.css'

const t = reportText.externalCommentModal

interface Props {
  visible: boolean
  /** The comment the reviewer typed. Edited here, it is the same field. */
  body: string
  isLoading?: boolean
  onBodyChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

/**
 * Last stop before a comment reaches the applicant. Sending one reopens their
 * island.is application, so the text gets one more look — still editable here.
 *
 * The input is driven straight off the comment box rather than a local copy.
 * `Modal` dismisses on Esc and on a backdrop click and keeps its children
 * mounted afterwards, so a local copy would let the reviewer expand their
 * comment in here, tap Esc, and lose every word of it with nothing to say so.
 */
export const ExternalCommentConfirmModal = ({
  visible,
  body,
  isLoading = false,
  onBodyChange,
  onClose,
  onSubmit,
}: Props) => {
  return (
    <Modal
      baseId="external-comment-confirm-modal"
      onVisibilityChange={(v) => {
        if (!v) onClose()
      }}
      isVisible={visible}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className={styles.modalContent}>
          <Text variant="h3">{t.heading}</Text>
          <Text>{t.description}</Text>
          <AlertMessage
            type="warning"
            title={t.warningTitle}
            message={t.warningMessage}
          />
          <Input
            name="external-comment-body-input"
            label={t.bodyLabel}
            size="sm"
            textarea
            rows={4}
            backgroundColor="blue"
            value={body}
            disabled={isLoading}
            onChange={(val) => onBodyChange(val.target.value)}
          />
          <Button
            fluid
            size="default"
            type="submit"
            onClick={onSubmit}
            disabled={body.trim().length === 0 || isLoading}
            loading={isLoading}
          >
            {t.submitButton}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
