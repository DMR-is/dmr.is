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

import { SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY } from '../../lib/constants'
import { sharedText, systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import {
  formatPercentValue,
  parsePercentInput,
  parseStoredPercent,
} from '../../lib/utils'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = systemSettingsText.modal

type Props = {
  /** Active threshold as stored in config, e.g. `"3.9"`. */
  currentValue: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Two-step lowering of the salary-difference threshold: enter the new value,
 * then confirm it against the current one. The confirm step exists because the
 * change cannot be undone — the API refuses any later attempt to raise the
 * value again — so the admin is shown the exact before/after before it is saved.
 */
export const LowerSalaryThresholdModal = ({
  currentValue,
  isOpen,
  onClose,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [value, setValue] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  // Reopening after a cancel must not resurrect the previous attempt's value.
  useEffect(() => {
    if (isOpen) {
      setValue('')
      setIsConfirming(false)
    }
  }, [isOpen])

  const lowerThreshold = useMutation({
    ...trpc.config.updateByKey.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.config.getByKey.queryKey({
          key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: trpc.config.getHistoryByKey.queryKey({
          key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
        }),
      })
      toast.success(t.saveSuccess)
      onClose()
    },
    onError: (error) => {
      // `error.message` is the API's English developer message. The Icelandic
      // one travels alongside it on `data.translatedMessage`, so prefer that —
      // this is an Icelandic-only admin UI.
      const translated = error.data?.translatedMessage
      toast.error(translated ? `${t.saveError} - ${translated}` : t.saveError, {
        autoClose: 5000,
      })
    },
  })

  // Read the active value the way the API does. A row nobody can parse is a
  // broken threshold, not an absent one: the API refuses the update outright, so
  // the form must not offer a lowering it knows will be rejected.
  const current = parseStoredPercent(currentValue)
  const parsed = parsePercentInput(value)
  const isTouched = value.trim() !== ''

  const errorMessage =
    current === null
      ? t.currentValueMalformed
      : !isTouched
        ? undefined
        : parsed === null
          ? t.notANumber
          : parsed >= current
            ? t.tooHigh(formatPercentValue(currentValue))
            : undefined

  const canContinue = parsed !== null && !errorMessage

  return (
    <Modal
      baseId="lower-salary-threshold-modal"
      isVisible={isOpen}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      <Stack space={3}>
        <Box>
          <Text variant="eyebrow" color="blue400">
            {t.currentLabel}
          </Text>
          <Text variant="h3">{formatPercentValue(currentValue)}%</Text>
        </Box>

        {isConfirming && parsed !== null ? (
          <>
            <AlertMessage
              type="warning"
              title={t.confirmTitle}
              message={t.confirmMessage(
                formatPercentValue(currentValue),
                formatPercentValue(String(parsed)),
              )}
            />

            <Inline justifyContent="flexEnd" space={2}>
              <Button
                variant="ghost"
                size="small"
                disabled={lowerThreshold.isPending}
                onClick={() => setIsConfirming(false)}
              >
                {t.back}
              </Button>
              <Button
                size="small"
                colorScheme="destructive"
                loading={lowerThreshold.isPending}
                onClick={() =>
                  lowerThreshold.mutate({
                    key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
                    value: String(parsed),
                  })
                }
              >
                {t.confirmButton}
              </Button>
            </Inline>
          </>
        ) : (
          <>
            <AlertMessage
              type="warning"
              title={systemSettingsText.irreversibleTitle}
              message={systemSettingsText.irreversibleMessage}
            />

            <TextInput
              name="salary-threshold"
              label={t.newValueLabel}
              size="xs"
              inputMode="decimal"
              value={value}
              hasError={!!errorMessage}
              errorMessage={errorMessage}
              onChange={(e) => setValue(e.target.value)}
            />

            <Inline justifyContent="flexEnd" space={2}>
              <Button variant="ghost" size="small" onClick={onClose}>
                {sharedText.form.cancel}
              </Button>
              <Button
                size="small"
                disabled={!canContinue}
                onClick={() => setIsConfirming(true)}
              >
                {t.continue}
              </Button>
            </Inline>
          </>
        )}
      </Stack>
    </Modal>
  )
}
