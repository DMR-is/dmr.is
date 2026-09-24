'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { sharedText } from '../lib/text'

type Props = {
  baseId: string
  isOpen: boolean
  title: string
  /** Names the thing being acted on, so the warning cannot be misread. */
  subject: string
  message: string
  confirmLabel: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

/** A destructive confirmation — revoking a key or a delegation. */
export const ConfirmModal = ({
  baseId,
  isOpen,
  title,
  subject,
  message,
  confirmLabel,
  isPending,
  onConfirm,
  onClose,
}: Props) => (
  <Modal
    baseId={baseId}
    isVisible={isOpen}
    title={title}
    onVisibilityChange={(visible) => {
      if (!visible) onClose()
    }}
    toggleClose={onClose}
    width="small"
  >
    <Stack space={3}>
      <AlertMessage type="warning" title={subject} message={message} />
      <Inline space={2} justifyContent="flexEnd">
        <Button variant="ghost" size="small" onClick={onClose}>
          {sharedText.cancel}
        </Button>
        <Button
          size="small"
          colorScheme="destructive"
          loading={isPending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </Inline>
    </Stack>
  </Modal>
)
