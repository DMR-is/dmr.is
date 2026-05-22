'use client'

import React from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { reportText } from '../../../lib/text'
import * as styles from './ReportDenialModal.css'

const t = reportText.denialModal

interface ReportDenialModalProps {
  visible: boolean
  isLoading?: boolean
  onClose: () => void
  onSubmit: (denialReason: string) => void
}
export const ReportDenialModal = ({
  visible,
  isLoading = false,
  onClose,
  onSubmit,
}: ReportDenialModalProps) => {
  const [denialReason, setDenialReason] = React.useState('')
  const handleChange = (value: string | null) => {
    if (value && value.length > 0 && denialReason !== value) {
      setDenialReason(value)
    }
  }

  return (
    <Modal
      baseId="report-denial-modal"
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
            name="denial-reason-input"
            label={t.reasonLabel}
            size="sm"
            textarea
            rows={4}
            backgroundColor="blue"
            value={denialReason}
            disabled={isLoading}
            onChange={(val) => handleChange(val.target.value)}
          />
          <Button
            fluid
            size="default"
            type="submit"
            onClick={() => onSubmit(denialReason)}
            disabled={denialReason.length === 0 || isLoading}
            loading={isLoading}
          >
            {t.submitButton}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
