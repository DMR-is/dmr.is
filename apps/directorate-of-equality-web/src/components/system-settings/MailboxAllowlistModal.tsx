'use client'

import { useEffect, useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { RadioButton } from '@dmr.is/ui/components/island-is/RadioButton'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { MAILBOX_ALLOWLIST_CONFIG_KEY } from '../../lib/constants'
import { sharedText, systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'
import {
  invalidNationalIds,
  type MailboxAllowlistMode,
  normalizeMailboxAllowlist,
  parseMailboxAllowlist,
  splitTypedNationalIds,
} from './mailboxAllowlist'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = systemSettingsText.mailbox

type Props = {
  /** The stored value, e.g. `none`, `*` or `1234567890,0987654321`. */
  currentValue: string
  isOpen: boolean
  onClose: () => void
}

const MODES: { value: MailboxAllowlistMode; label: string }[] = [
  { value: 'none', label: t.modeNone },
  { value: 'list', label: t.modeList },
  { value: 'all', label: t.modeAll },
]

/**
 * Sets who gets notices in their island.is mailbox. Opening it to a company
 * releases every receipt still held for it, however old (doe-api
 * `db/README.md`, "Before turning the flag on, or adding a company to the
 * allowlist"), so that is said whenever companies are added, and `*` takes a
 * second, explicit confirmation, as lowering the salary threshold does.
 */
export const MailboxAllowlistModal = ({
  currentValue,
  isOpen,
  onClose,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<MailboxAllowlistMode>('none')
  const [nationalIds, setNationalIds] = useState('')
  const [touched, setTouched] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Each opening starts from what is stored, not from a cancelled edit. The
  // section opens this only once the stored value has loaded.
  useEffect(() => {
    if (!isOpen) return
    const current = parseMailboxAllowlist(currentValue)
    setMode(current.mode)
    setNationalIds(
      current.mode === 'list'
        ? current.nationalIds.map(formatNationalId).join(', ')
        : '',
    )
    setTouched(false)
    setIsConfirming(false)
    // `currentValue` is read at opening only: a refetch while the modal is
    // open must not wipe the admin's edit.
  }, [isOpen])

  const save = useMutation({
    ...trpc.config.updateByKey.mutationOptions(),
    onSuccess: async () => {
      // Awaited, so reopening at once shows the saved value, not the old one.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.config.getByKey.queryKey({
            key: MAILBOX_ALLOWLIST_CONFIG_KEY,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.config.getHistoryByKey.queryKey({
            key: MAILBOX_ALLOWLIST_CONFIG_KEY,
          }),
        }),
      ])
      toast.success(t.modal.saveSuccess)
      onClose()
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated ? `${t.modal.saveError} - ${translated}` : t.modal.saveError,
        { autoClose: 5000 },
      )
    },
  })

  const current = parseMailboxAllowlist(currentValue)
  const entries = [...new Set(splitTypedNationalIds(nationalIds))]
  const invalid = invalidNationalIds(entries)

  const value =
    mode === 'all' ? '*' : mode === 'none' ? 'none' : entries.join(',')
  const unchanged = value === normalizeMailboxAllowlist(currentValue)

  // Companies the mailbox opens to with this change: their held receipts go.
  const opensTo =
    mode === 'list'
      ? current.mode === 'all'
        ? []
        : entries.filter(
            (id) =>
              current.mode !== 'list' || !current.nationalIds.includes(id),
          )
      : []

  const listError =
    mode !== 'list' || !touched
      ? undefined
      : entries.length === 0
        ? t.modal.nationalIdsEmpty
        : invalid.length > 0
          ? t.modal.nationalIdsInvalid(invalid.map(formatNationalId).join(', '))
          : undefined

  const canSave =
    !unchanged &&
    (mode !== 'list' || (entries.length > 0 && invalid.length === 0))

  const submit = () => {
    setTouched(true)
    if (!canSave) return
    if (mode === 'all' && !isConfirming) {
      setIsConfirming(true)
      return
    }
    save.mutate({ key: MAILBOX_ALLOWLIST_CONFIG_KEY, value })
  }

  return (
    <Modal
      baseId="mailbox-allowlist-modal"
      isVisible={isOpen}
      title={t.modal.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      {isConfirming ? (
        <Stack space={3}>
          <AlertMessage
            type="warning"
            title={t.modal.confirmAllTitle}
            message={t.modal.confirmAllMessage}
          />
          <AlertMessage
            type="info"
            title={t.modal.heldReceiptsTitle}
            message={t.modal.heldReceiptsMessage}
          />
          <Inline justifyContent="flexEnd" space={2}>
            <Button
              variant="ghost"
              size="small"
              disabled={save.isPending}
              onClick={() => setIsConfirming(false)}
            >
              {t.modal.back}
            </Button>
            <Button
              size="small"
              colorScheme="destructive"
              loading={save.isPending}
              onClick={submit}
            >
              {t.modal.confirmAllButton}
            </Button>
          </Inline>
        </Stack>
      ) : (
        <Stack space={3}>
          <div role="radiogroup" aria-labelledby="mailbox-allowlist-mode-label">
            <Stack space={1}>
              <Text
                id="mailbox-allowlist-mode-label"
                variant="eyebrow"
                color="blue400"
              >
                {t.modal.modeLabel}
              </Text>
              {MODES.map((option) => (
                <RadioButton
                  key={option.value}
                  id={`mailbox-allowlist-${option.value}`}
                  name="mailbox-allowlist-mode"
                  value={option.value}
                  label={option.label}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  large
                  backgroundColor="blue"
                />
              ))}
            </Stack>
          </div>

          {mode === 'list' && (
            <Input
              name="mailbox-allowlist-national-ids"
              label={t.modal.nationalIdsLabel}
              placeholder={t.modal.nationalIdsPlaceholder}
              textarea
              rows={3}
              value={nationalIds}
              hasError={!!listError}
              errorMessage={listError}
              onChange={(e) => setNationalIds(e.target.value)}
              onBlur={() => setTouched(true)}
            />
          )}

          {mode === 'all' && (
            <AlertMessage
              type="warning"
              title={t.modal.allWarningTitle}
              message={t.modal.allWarningMessage}
            />
          )}

          {opensTo.length > 0 && invalid.length === 0 && (
            <AlertMessage
              type="info"
              title={t.modal.heldReceiptsTitle}
              message={t.modal.heldReceiptsMessage}
            />
          )}

          {unchanged && <Text variant="small">{t.modal.unchanged}</Text>}

          <Inline justifyContent="flexEnd" space={2}>
            <Button
              variant="ghost"
              size="small"
              disabled={save.isPending}
              onClick={onClose}
            >
              {sharedText.form.cancel}
            </Button>
            <Button
              size="small"
              disabled={!canSave}
              loading={save.isPending}
              onClick={submit}
            >
              {mode === 'all' ? t.modal.continue : t.modal.save}
            </Button>
          </Inline>
        </Stack>
      )}
    </Modal>
  )
}
