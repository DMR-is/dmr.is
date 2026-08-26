'use client'

import React from 'react'

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
  /** The comment the reviewer already typed — the modal opens prefilled with it. */
  initialBody: string
  isLoading?: boolean
  onClose: () => void
  onSubmit: (body: string) => void
}

/**
 * Last stop before a comment reaches the applicant. Sending one reopens their
 * island.is application, so the text gets one more look — prefilled from the
 * comment box, still editable here.
 */
export const ExternalCommentConfirmModal = ({
  visible,
  initialBody,
  isLoading = false,
  onClose,
  onSubmit,
}: Props) => {
  const [body, setBody] = React.useState(initialBody)

  // Re-seed each time the modal opens: the reviewer may have edited the comment
  // box since the last time they opened it.
  React.useEffect(() => {
    if (visible) {
      setBody(initialBody)
    }
  }, [visible, initialBody])

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
            onChange={(val) => setBody(val.target.value)}
          />
          <Button
            fluid
            size="default"
            type="submit"
            onClick={() => onSubmit(body.trim())}
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
