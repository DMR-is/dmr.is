'use client'

import { useEffect, useRef, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { companiesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * The key-issuing copy is the same as for a company key — label, lifetime,
 * the one-time reveal — so it is reused rather than restated. A vendor key has
 * no scopes of its own; the firm's scopes are the ones that count.
 */
const t = companiesText.detailView.apiKeys.modal

const EXPIRY_OPTIONS: { label: string; value: number | null }[] = [
  { label: t.expires90Days, value: 90 },
  { label: t.expires1Year, value: 365 },
  { label: t.expires2Years, value: 730 },
  { label: t.expiresNever, value: null },
]

const DEFAULT_EXPIRY_DAYS = 365

const expiryToIso = (days: number | null): string | undefined => {
  if (days === null) return undefined
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

type Props = {
  partnerClientId: string
  isOpen: boolean
  onClose: () => void
}

/**
 * The form, then the created key — shown once, because only its hash is
 * stored. Dismissable for the same reason `IssueApiKeyModal` is: the shared
 * Modal cannot opt out of Esc or a backdrop click, so the warning is the
 * mitigation. The secret lives in component state only.
 */
export const IssuePartnerClientKeyModal = ({
  partnerClientId,
  isOpen,
  onClose,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [label, setLabel] = useState('')
  const [expiryDays, setExpiryDays] = useState<number | null>(
    DEFAULT_EXPIRY_DAYS,
  )
  const [issuedKey, setIssuedKey] = useState<string | null>(null)

  // Whether this modal is still showing. A key minted after the admin closed
  // it must not be stashed in state for a dialog nobody will see.
  const isShowingRef = useRef(isOpen)

  useEffect(() => {
    isShowingRef.current = isOpen
    if (isOpen) {
      setLabel('')
      setExpiryDays(DEFAULT_EXPIRY_DAYS)
      setIssuedKey(null)
    }
  }, [isOpen])

  const issue = useMutation({
    ...trpc.partnerClient.issueKey.mutationOptions(),
    // Evicted from the MutationCache as soon as nothing observes it. `reset()`
    // on close only detaches the observer; without this the plaintext secret
    // would sit in the cache for the default five minutes.
    gcTime: 0,
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: trpc.partnerClient.listKeys.queryKey({ id: partnerClientId }),
      })
      if (!isShowingRef.current) {
        toast.error(t.createdAfterCloseToast, { autoClose: 8000 })
        return
      }
      setIssuedKey(created.key)
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated
          ? `${t.createErrorToast} - ${translated}`
          : t.createErrorToast,
        { autoClose: 5000 },
      )
    },
  })

  /**
   * Every way out of the modal goes through here, so the one-time secret does
   * not outlive it: the shared Modal keeps the dialog mounted when hidden, and
   * the mutation cache would otherwise hold the key until the next open.
   */
  const close = () => {
    isShowingRef.current = false
    setIssuedKey(null)
    issue.reset()
    onClose()
  }

  const copy = async () => {
    if (!issuedKey) return

    try {
      await navigator.clipboard.writeText(issuedKey)
      toast.success(t.copiedToast)
    } catch {
      toast.error(t.copyError, { autoClose: 5000 })
    }
  }

  return (
    <Modal
      baseId="issue-partner-client-key-modal"
      isVisible={isOpen}
      title={issuedKey ? t.createdTitle : t.title}
      onVisibilityChange={(visible) => {
        if (!visible) close()
      }}
      toggleClose={close}
      width="small"
      allowOverflow
    >
      {issuedKey ? (
        <Stack space={3}>
          <AlertMessage
            type="warning"
            title={t.createdTitle}
            message={t.createdWarning}
          />
          <Box background="blue100" padding={2} borderRadius="large">
            <code style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
              {issuedKey}
            </code>
          </Box>
          <Inline space={2} justifyContent="flexEnd">
            <Button variant="ghost" size="small" onClick={copy}>
              {t.copyButton}
            </Button>
            <Button size="small" onClick={close}>
              {t.doneButton}
            </Button>
          </Inline>
        </Stack>
      ) : (
        <Stack space={3}>
          <TextInput
            name="partner-client-key-label"
            label={t.labelLabel}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Text variant="small" color="dark400">
            {t.labelHint}
          </Text>

          <Select
            name="partner-client-key-expiry"
            size="xs"
            label={t.expiresLabel}
            options={EXPIRY_OPTIONS}
            value={EXPIRY_OPTIONS.find((o) => o.value === expiryDays) ?? null}
            onChange={(opt) => {
              if (opt) setExpiryDays(opt.value)
            }}
          />
          <Text variant="small" color="dark400">
            {t.expiresHint}
          </Text>

          <Inline space={2} justifyContent="flexEnd">
            <Button variant="ghost" size="small" onClick={close}>
              {t.cancelButton}
            </Button>
            <Button
              size="small"
              loading={issue.isPending}
              onClick={() =>
                issue.mutate({
                  id: partnerClientId,
                  label: label.trim() === '' ? undefined : label.trim(),
                  expiresAt: expiryToIso(expiryDays),
                })
              }
            >
              {t.createButton}
            </Button>
          </Inline>
        </Stack>
      )}
    </Modal>
  )
}
