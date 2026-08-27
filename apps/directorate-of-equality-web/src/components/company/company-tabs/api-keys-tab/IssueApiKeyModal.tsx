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

import { companiesText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = companiesText.detailView.apiKeys

type Props = {
  companyId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Two states, not two steps: the form, then the created key.
 *
 * The second state exists because the plaintext secret is returned exactly once
 * — the API stores only a hash of it — so the admin has to be given a chance to
 * copy it before the modal closes. It deliberately has no cancel affordance and
 * does not close on its own: dismissing it is the only way out, and that has to
 * be a decision rather than a stray click.
 *
 * The secret is held in component state and never written to the query cache,
 * so it does not survive a remount or reach any other screen.
 */
export const IssueApiKeyModal = ({ companyId, isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [label, setLabel] = useState('')
  const [issuedKey, setIssuedKey] = useState<string | null>(null)

  // Reopening must not show the previous key or the previous label.
  useEffect(() => {
    if (isOpen) {
      setLabel('')
      setIssuedKey(null)
    }
  }, [isOpen])

  const issue = useMutation({
    ...trpc.apiKey.issue.mutationOptions(),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: trpc.apiKey.listForCompany.queryKey({ companyId }),
      })
      setIssuedKey(created.key)
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated
          ? `${t.modal.createErrorToast} - ${translated}`
          : t.modal.createErrorToast,
        { autoClose: 5000 },
      )
    },
  })

  const copy = async () => {
    if (!issuedKey) return

    await navigator.clipboard.writeText(issuedKey)
    toast.success(t.modal.copiedToast)
  }

  return (
    <Modal
      baseId="issue-api-key-modal"
      isVisible={isOpen}
      title={issuedKey ? t.modal.createdTitle : t.modal.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      {issuedKey ? (
        <Stack space={3}>
          <AlertMessage
            type="warning"
            title={t.modal.createdTitle}
            message={t.modal.createdWarning}
          />

          {/* A plain <code> rather than Text: the key is one unbroken ~68
              character string, and Text has no word-break prop — only
              `truncate`, which would hide part of the one thing the admin has
              to copy. */}
          <Box background="blue100" padding={2} borderRadius="large">
            <code style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
              {issuedKey}
            </code>
          </Box>

          <Inline space={2} justifyContent="flexEnd">
            <Button variant="ghost" size="small" onClick={copy}>
              {t.modal.copyButton}
            </Button>
            <Button size="small" onClick={onClose}>
              {t.modal.doneButton}
            </Button>
          </Inline>
        </Stack>
      ) : (
        <Stack space={3}>
          <TextInput
            name="api-key-label"
            label={t.modal.labelLabel}
            placeholder={t.modal.labelPlaceholder}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Text variant="small" color="dark400">
            {t.modal.labelHint}
          </Text>

          <Inline space={2} justifyContent="flexEnd">
            <Button variant="ghost" size="small" onClick={onClose}>
              {t.modal.cancelButton}
            </Button>
            <Button
              size="small"
              loading={issue.isPending}
              onClick={() =>
                issue.mutate({
                  companyId,
                  label: label.trim() === '' ? undefined : label.trim(),
                })
              }
            >
              {t.modal.createButton}
            </Button>
          </Inline>
        </Stack>
      )}
    </Modal>
  )
}
