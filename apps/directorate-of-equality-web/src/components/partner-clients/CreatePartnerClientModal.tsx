'use client'

import { useEffect, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { partnerClientsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { FILING_AND_SCORING_SCOPES, FILING_SCOPES } from './scopes'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = partnerClientsText.createModal

const SCOPE_OPTIONS: { label: string; value: string }[] = [
  { label: t.scopeFilingOnly, value: 'filing' },
  { label: t.scopeFilingAndScoring, value: 'filing+scoring' },
]

type Props = {
  isOpen: boolean
  onClose: () => void
}

/** Approving a firm. The kennitala is checked by the API, which answers 409 for a firm already approved. */
export const CreatePartnerClientModal = ({ isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [scoping, setScoping] = useState<string>('filing')

  // Reopening starts clean. Carrying a previous grant of scoring:write into
  // the next firm is the surprise to avoid.
  useEffect(() => {
    if (isOpen) {
      setName('')
      setNationalId('')
      setScoping('filing')
    }
  }, [isOpen])

  const create = useMutation({
    ...trpc.partnerClient.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.partnerClient.list.queryKey(),
      })
      toast.success(t.createdToast)
      onClose()
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

  const canSubmit = name.trim() !== '' && nationalId.trim() !== ''

  return (
    <Modal
      baseId="create-partner-client-modal"
      isVisible={isOpen}
      title={t.title}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
      allowOverflow
    >
      <Stack space={3}>
        <TextInput
          name="partner-client-name"
          label={t.nameLabel}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextInput
          name="partner-client-national-id"
          label={t.nationalIdLabel}
          value={nationalId}
          onChange={(event) => setNationalId(event.target.value)}
        />

        <Select
          name="partner-client-scoping"
          size="xs"
          label={t.scopingLabel}
          options={SCOPE_OPTIONS}
          value={SCOPE_OPTIONS.find((o) => o.value === scoping) ?? null}
          onChange={(opt) => {
            if (opt) setScoping(opt.value)
          }}
        />
        <Text variant="small" color="dark400">
          {t.scopingHint}
        </Text>

        <Inline space={2} justifyContent="flexEnd">
          <Button variant="ghost" size="small" onClick={onClose}>
            {t.cancelButton}
          </Button>
          <Button
            size="small"
            disabled={!canSubmit}
            loading={create.isPending}
            onClick={() =>
              create.mutate({
                name: name.trim(),
                nationalId: nationalId.trim(),
                // Sent explicitly in both cases, so what the admin picked is
                // what is stored rather than whatever the server defaults to.
                scopes:
                  scoping === 'filing+scoring'
                    ? [...FILING_AND_SCORING_SCOPES]
                    : [...FILING_SCOPES],
              })
            }
          >
            {t.createButton}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
