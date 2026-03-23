import { useEffect, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import { toast } from '@dmr.is/ui/utils/toast'

import { RegulationImpact } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { OJOIInput } from '../select/OJOIInput'

import { useMutation } from '@tanstack/react-query'

type Props = {
  visible: boolean
  onClose: () => void
  caseId: string
  impact?: RegulationImpact
  onSuccess: () => void
}

export const EditCancellationModal = ({
  visible,
  onClose,
  caseId,
  impact,
  onSuccess,
}: Props) => {
  const trpc = useTRPC()
  const isEdit = !!impact

  const [regulation, setRegulation] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    if (visible) {
      setRegulation(impact?.regulation ?? '')
      setDate(impact?.date ?? '')
    }
  }, [visible, impact])

  const createMutation = useMutation(
    trpc.createRegulationCancel.mutationOptions({
      onSuccess: () => {
        toast.success('Brottfellingu bætt við')
        onSuccess()
        onClose()
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við brottfellingu')
      },
    }),
  )

  const updateMutation = useMutation(
    trpc.updateRegulationCancel.mutationOptions({
      onSuccess: () => {
        toast.success('Brottfelling uppfærð')
        onSuccess()
        onClose()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra brottfellingu')
      },
    }),
  )

  const isPending = createMutation.isPending || updateMutation.isPending
  const canSubmit = regulation && date

  const handleSave = () => {
    if (!canSubmit) return

    if (isEdit) {
      updateMutation.mutate({
        caseId,
        cancelId: impact.id,
        date,
      })
    } else {
      createMutation.mutate({
        caseId,
        regulation,
        date,
      })
    }
  }

  return (
    <Modal
      baseId="edit-cancellation-modal"
      isVisible={visible}
      onVisibilityChange={(v) => {
        if (!v) onClose()
      }}
      title={isEdit ? 'Breyta brottfellingu' : 'Ný brottfelling'}
      width="small"
    >
      <Stack space={3}>
        <OJOIInput
          name="cancel-regulation"
          label="Reglugerð (t.d. 0665/2020)"
          value={regulation}
          disabled={isEdit}
          onChange={(e) => setRegulation(e.target.value)}
        />

        <Box>
          <Text variant="small" fontWeight="semiBold" marginBottom={1}>
            Gildistökudagur
          </Text>
          <DatePicker
            locale="is"
            size="sm"
            backgroundColor="blue"
            selected={date ? new Date(date) : undefined}
            label="Dagsetning"
            placeholderText="Veldu dagsetningu"
            handleChange={(d) => {
              setDate(d.toISOString().split('T')[0])
            }}
          />
        </Box>

        <Inline space={2} justifyContent="flexEnd">
          <Button size="small" variant="ghost" onClick={onClose}>
            Hætta við
          </Button>
          <Button
            size="small"
            onClick={handleSave}
            disabled={!canSubmit}
            loading={isPending}
          >
            Vista
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
