'use client'

import { useEffect, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { partnerClientsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const t = partnerClientsText.createModal

type Props = {
  isOpen: boolean
  onClose: () => void
}

/**
 * Approving a firm. The kennitala is checked by the API, which answers 409 for
 * a firm already approved.
 *
 * No scopes are offered or sent: approval is all or nothing, and the API
 * approves every scope when none is named. A per-scope choice here was a
 * decision few reviewers could make well, and a firm approved without
 * `scoring:write` could file for no company whose starfsmat it maintains.
 */
export const CreatePartnerClientModal = ({ isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [nationalId, setNationalId] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName('')
      setNationalId('')
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
        <Text variant="small" color="dark400">
          {t.accessHint}
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
