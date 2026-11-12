'use client'

import { useEffect, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { type NoticeIssueDeliveryDto } from '../../gen/fetch/types.gen'
import { noticeIssuesText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = noticeIssuesText.reconcile

type Props = {
  delivery: NoticeIssueDeliveryDto | null
  onClose: () => void
}

/**
 * Settles a delivery that may already have reached the company's mailbox. The
 * admin checks One first, then says what it shows: two separate buttons, so
 * neither outcome is the default.
 */
export const ReconcileDeliveryModal = ({ delivery, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [documentItemId, setDocumentItemId] = useState('')
  const [showRequired, setShowRequired] = useState(false)

  useEffect(() => {
    setDocumentItemId('')
    setShowRequired(false)
  }, [delivery?.id])

  const reconcile = useMutation({
    ...trpc.noticeIssues.reconcileDelivery.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.noticeIssues.getIssues.queryFilter())
      toast.success(t.success)
      onClose()
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(translated ? `${t.error} - ${translated}` : t.error, {
        autoClose: 5000,
      })
    },
  })

  if (!delivery) return null

  const savedDocumentId = delivery.oneDocumentItemId ?? null
  const typedId = documentItemId.trim()

  const submit = (outcome: 'SENT' | 'NOT_SENT') => {
    if (outcome === 'SENT' && !savedDocumentId && !typedId) {
      setShowRequired(true)
      return
    }
    reconcile.mutate({
      id: delivery.id,
      outcome,
      documentItemId: savedDocumentId ? undefined : typedId || undefined,
    })
  }

  return (
    <Modal
      baseId="reconcile-delivery-modal"
      isVisible={!!delivery}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      <Stack space={3}>
        <AlertMessage
          type="warning"
          title={t.warningTitle}
          message={t.warningMessage}
        />

        <Box>
          <Text variant="eyebrow" color="blue400">
            {t.caseNumberLabel}
          </Text>
          <Text>{delivery.oneCaseNumber ?? t.unknown}</Text>
        </Box>

        {savedDocumentId ? (
          <Box>
            <Text variant="eyebrow" color="blue400">
              {t.documentIdLabel}
            </Text>
            <Text>{savedDocumentId}</Text>
          </Box>
        ) : (
          <Stack space={1}>
            <TextInput
              name="document-item-id"
              label={t.documentIdLabel}
              size="xs"
              value={documentItemId}
              hasError={showRequired && !typedId}
              errorMessage={
                showRequired && !typedId ? t.documentIdRequired : undefined
              }
              onChange={(e) => setDocumentItemId(e.target.value)}
            />
            <Text variant="small">{t.documentIdHelp}</Text>
          </Stack>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button
            variant="ghost"
            size="small"
            disabled={reconcile.isPending}
            onClick={onClose}
          >
            {sharedText.form.cancel}
          </Button>
          <Button
            variant="ghost"
            size="small"
            loading={reconcile.isPending}
            onClick={() => submit('NOT_SENT')}
          >
            {t.notSentButton}
          </Button>
          <Button
            size="small"
            loading={reconcile.isPending}
            onClick={() => submit('SENT')}
          >
            {t.sentButton}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
