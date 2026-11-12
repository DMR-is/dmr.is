'use client'

import { useEffect, useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
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
  parseMailboxAllowlist,
  splitNationalIds,
} from './mailboxAllowlist'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = systemSettingsText.mailbox

type Props = {
  /** The stored value, e.g. `none`, `*` or `1234567890,0987654321`. */
  currentValue: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Sets who gets notices in their island.is mailbox. `*` reaches every company
 * at once, including every notice already waiting, so it is said plainly
 * before it is saved.
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

  // Opening starts from what is stored, not from a cancelled edit.
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
  }, [isOpen, currentValue])

  const save = useMutation({
    ...trpc.config.updateByKey.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.config.getByKey.queryKey({
          key: MAILBOX_ALLOWLIST_CONFIG_KEY,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.config.getHistoryByKey.queryKey({
          key: MAILBOX_ALLOWLIST_CONFIG_KEY,
        }),
      })
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

  const entries = splitNationalIds(nationalIds)
  const invalid = invalidNationalIds(entries)
  const listError =
    mode !== 'list' || !touched
      ? undefined
      : entries.length === 0
        ? t.modal.nationalIdsEmpty
        : invalid.length > 0
          ? t.modal.nationalIdsInvalid(invalid.join(', '))
          : undefined
  const canSave =
    mode !== 'list' || (entries.length > 0 && invalid.length === 0)

  const value =
    mode === 'all'
      ? '*'
      : mode === 'none'
        ? 'none'
        : [...new Set(entries)].join(',')

  const modeButton = (target: MailboxAllowlistMode, label: string) => (
    <Button
      size="small"
      variant={mode === target ? 'primary' : 'ghost'}
      onClick={() => setMode(target)}
    >
      {label}
    </Button>
  )

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
      <Stack space={3}>
        <Stack space={1}>
          <Text variant="eyebrow" color="blue400">
            {t.modal.modeLabel}
          </Text>
          <Inline space={1}>
            {modeButton('none', t.modeNone)}
            {modeButton('list', t.modeList)}
            {modeButton('all', t.modeAll)}
          </Inline>
        </Stack>

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

        <Box>
          <Text variant="small">{t.flagNote}</Text>
        </Box>

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
            colorScheme={mode === 'all' ? 'destructive' : 'default'}
            disabled={!canSave}
            loading={save.isPending}
            onClick={() => {
              setTouched(true)
              if (!canSave) return
              save.mutate({ key: MAILBOX_ALLOWLIST_CONFIG_KEY, value })
            }}
          >
            {t.modal.save}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
