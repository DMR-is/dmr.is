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

import { keyText, sharedText } from '../../lib/text'

const t = keyText.modal

/**
 * Lifetimes rather than a date picker: "how long should this last" is the
 * question a representative can answer, and it rules out the typo that
 * expires a key in 2025 or 2125.
 */
const EXPIRY_OPTIONS: { label: string; value: number | null }[] = [
  { label: t.expires90Days, value: 90 },
  { label: t.expires1Year, value: 365 },
  { label: t.expires2Years, value: 730 },
  { label: t.expiresNever, value: null },
]

/** One year. A credential that outlives its integration is the common
 *  failure, so the default is finite. */
const DEFAULT_EXPIRY_DAYS = 365

const expiryToIso = (days: number | null): string | undefined => {
  if (days === null) return undefined
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export type IssueKeyInput = {
  label?: string
  expiresAt?: string
}

type Props = {
  baseId: string
  title: string
  labelPlaceholder: string
  isOpen: boolean
  isPending: boolean
  /** Resolves to the plaintext key. Rejections are reported by the caller. */
  onIssue: (input: IssueKeyInput) => Promise<string>
  onClose: () => void
}

/**
 * Two states: the form, then the created key, which is returned exactly once —
 * the API stores only a hash — so it has to be shown before the modal closes.
 *
 * ⚠️ The shared `Modal` is always dismissable (Esc, backdrop, the X), which
 * would destroy the only copy of the secret. That is mitigated, not prevented:
 * the warning says the key will not be shown again, and losing it costs an
 * issue-and-revoke cycle rather than anything unrecoverable. The same trade-off
 * as directorate-of-equality-web's `IssueApiKeyModal`.
 *
 * The secret lives in component state only, never in the query cache.
 *
 * No scope choice: a key is all or nothing. A company key gets every scope
 * because none is named; a provider key has none of its own — what it may do
 * for a company is that company's delegation.
 */
export const IssueKeyModal = ({
  baseId,
  title,
  labelPlaceholder,
  isOpen,
  isPending,
  onIssue,
  onClose,
}: Props) => {
  const [label, setLabel] = useState('')
  const [expiryDays, setExpiryDays] = useState<number | null>(
    DEFAULT_EXPIRY_DAYS,
  )
  const [issuedKey, setIssuedKey] = useState<string | null>(null)

  // Whether the modal is still showing. A key minted after it was closed must
  // not be stashed for a dialog nobody will see.
  const isShowingRef = useRef(isOpen)

  // Reopening starts from the defaults.
  useEffect(() => {
    isShowingRef.current = isOpen
    if (isOpen) {
      setLabel('')
      setExpiryDays(DEFAULT_EXPIRY_DAYS)
      setIssuedKey(null)
    }
  }, [isOpen])

  // Unmounted is not showing: a key that lands afterwards gets the toast, not
  // a state update on a component that is gone.
  useEffect(
    () => () => {
      isShowingRef.current = false
    },
    [],
  )

  const close = () => {
    isShowingRef.current = false
    setIssuedKey(null)
    onClose()
  }

  const submit = async () => {
    try {
      const key = await onIssue({
        label: label.trim() === '' ? undefined : label.trim(),
        expiresAt: expiryToIso(expiryDays),
      })

      if (!isShowingRef.current) {
        toast.error(t.createdAfterCloseToast, { autoClose: 8000 })
        return
      }
      setIssuedKey(key)
    } catch {
      // The caller's mutation reports the failure.
    }
  }

  const copy = async () => {
    if (!issuedKey) return

    try {
      await navigator.clipboard.writeText(issuedKey)
      toast.success(t.copiedToast)
    } catch {
      // Silence would be the worst outcome: the user believes they hold the
      // only copy of a secret they do not.
      toast.error(t.copyError, { autoClose: 5000 })
    }
  }

  return (
    <Modal
      baseId={baseId}
      isVisible={isOpen}
      title={issuedKey ? t.createdTitle : title}
      onVisibilityChange={(visible) => {
        if (!visible) close()
      }}
      toggleClose={close}
      width="small"
      // The Select menus render inline, so the modal's own overflow would clip
      // them at the bottom edge. Safe while the form stays this short.
      allowOverflow
    >
      {issuedKey ? (
        <Stack space={3}>
          <AlertMessage
            type="warning"
            title={t.createdTitle}
            message={t.createdWarning}
          />

          {/* A plain <code>: the key is one unbroken string, and Text can only
              truncate it, which would hide part of what has to be copied. */}
          <Box background="blue100" padding={2} borderRadius="large">
            <code style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
              {issuedKey}
            </code>
          </Box>

          <Inline space={2} justifyContent="flexEnd">
            <Button
              variant="ghost"
              size="small"
              icon="copy"
              iconType="outline"
              onClick={copy}
            >
              {t.copyButton}
            </Button>
            <Button size="small" onClick={close}>
              {t.doneButton}
            </Button>
          </Inline>
        </Stack>
      ) : (
        <Stack space={3}>
          <Stack space={1}>
            <TextInput
              name={`${baseId}-label`}
              label={t.labelLabel}
              placeholder={labelPlaceholder}
              value={label}
              maxLength={256}
              onChange={(event) => setLabel(event.target.value)}
            />
            <Text variant="small" color="dark400">
              {t.labelHint}
            </Text>
          </Stack>

          <Stack space={1}>
            <Select
              name={`${baseId}-expiry`}
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
          </Stack>

          <Inline space={2} justifyContent="flexEnd">
            <Button variant="ghost" size="small" onClick={close}>
              {sharedText.cancel}
            </Button>
            <Button size="small" loading={isPending} onClick={submit}>
              {t.createButton}
            </Button>
          </Inline>
        </Stack>
      )}
    </Modal>
  )
}
