'use client'

import React from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { reportText } from '../../../lib/text'
import * as styles from './ReportDenialModal.css'

const t = reportText.sendToEditModal

interface ReportSendToEditModalProps {
  visible: boolean
  isLoading?: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

export const ReportSendToEditModal = ({
  visible,
  isLoading = false,
  onClose,
  onSubmit,
}: ReportSendToEditModalProps) => {
  const [reason, setReason] = React.useState('')

  return (
    <Modal
      baseId="report-send-to-edit-modal"
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
            name="send-to-edit-reason-input"
            label={t.reasonLabel}
            size="sm"
            textarea
            rows={4}
            backgroundColor="blue"
            value={reason}
            disabled={isLoading}
            onChange={(val) => setReason(val.target.value)}
          />
          <Button
            fluid
            size="default"
            type="submit"
            onClick={() => onSubmit(reason.trim())}
            disabled={reason.trim().length === 0 || isLoading}
            loading={isLoading}
          >
            {t.submitButton}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
