'use client'

import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import * as styles from './CompanyConfirmationModal.css'

interface CompanyConfirmationModalProps {
  text: {
    title: string
    description: string
    confirmButton: string
  }
  companyName: string
  visible: boolean
  isLoading?: boolean
  onClose: () => void
  onSubmit: () => void
}
export const CompanyConfirmationModal = ({
  text,
  companyName,
  visible,
  isLoading = false,
  onClose,
  onSubmit,
}: CompanyConfirmationModalProps) => {
  return (
    <Modal
      baseId="company-confirmation-modal"
      onVisibilityChange={(v) => {
        if (!v) onClose()
      }}
      isVisible={visible}
      width="small"
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className={styles.modalContent}>
          <Text variant="h3">{text.title + ' - ' + companyName}</Text>
          <Text marginBottom={3}>{text.description}</Text>
          <Button
            fluid
            size="default"
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
            loading={isLoading}
          >
            {text.confirmButton}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
