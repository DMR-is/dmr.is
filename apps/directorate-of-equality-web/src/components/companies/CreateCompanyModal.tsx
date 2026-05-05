'use client'

import { useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const CreateCompanyModal = ({ isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [nationalIdInput, setNationalIdInput] = useState('')
  const [lookupNationalId, setLookupNationalId] = useState<string | null>(null)
  const [employeeCount, setEmployeeCount] = useState('')

  const lookupQuery = useQuery({
    ...trpc.company.rskLookup.queryOptions({
      nationalId: lookupNationalId ?? '',
    }),
    enabled: !!lookupNationalId,
    retry: false,
  })

  const createMutation = useMutation({
    ...trpc.company.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.company.list.queryKey() })
      toast.success('Fyrirtæki skráð')
      handleClose()
    },
    onError: () => {
      toast.error('Villa við skráningu fyrirtækis')
    },
  })

  const handleClose = () => {
    setNationalIdInput('')
    setLookupNationalId(null)
    setEmployeeCount('')
    onClose()
  }

  const handleLookup = () => {
    if (nationalIdInput.trim()) {
      setLookupNationalId(nationalIdInput.trim())
    }
  }

  const handleCreate = () => {
    if (!lookupQuery.data || !employeeCount) return
    createMutation.mutate({
      nationalId: lookupQuery.data.nationalId,
      name: lookupQuery.data.name,
      averageEmployeeCountFromRsk: Number(employeeCount),
    })
  }

  const lookedUp = !!lookupQuery.data
  const canCreate = lookedUp && !!employeeCount && Number(employeeCount) > 0

  return (
    <Modal
      baseId="create-company-modal"
      isVisible={isOpen}
      title="Skrá nýtt fyrirtæki"
      onVisibilityChange={(visible) => {
        if (!visible) handleClose()
      }}
      toggleClose={handleClose}
      width="small"
    >
      <Stack space={3}>
        <Stack space={1}>
          <Text variant="eyebrow">Kennitala fyrirtækis</Text>
          <Inline space={2} alignY="center">
            <Box flexGrow={1}>
              <TextInput
                name="nationalId"
                label="Kennitala"
                placeholder="000000-0000"
                value={nationalIdInput}
                onChange={(e) => {
                  setNationalIdInput(e.target.value)
                  if (lookupNationalId) setLookupNationalId(null)
                }}
              />
            </Box>
            <Button
              variant="ghost"
              size="small"
              loading={lookupQuery.isFetching}
              disabled={!nationalIdInput.trim()}
              onClick={handleLookup}
            >
              Fletta upp
            </Button>
          </Inline>
          {lookupQuery.isError && (
            <Text color="red600" variant="small">
              Fyrirtæki fannst ekki í þjóðskrá
            </Text>
          )}
        </Stack>

        <TextInput
          name="name"
          label="Nafn fyrirtækis"
          value={lookupQuery.data?.name ?? ''}
          readOnly
          isLoading={lookupQuery.isFetching}
          disabled={!lookedUp}
        />

        <TextInput
          name="employeeCount"
          label="Meðalfjöldi starfsmanna"
          type="number"
          value={employeeCount}
          onChange={(e) => setEmployeeCount(e.target.value)}
          disabled={!lookedUp}
        />

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" onClick={handleClose}>
            Hætta við
          </Button>
          <Button
            disabled={!canCreate}
            loading={createMutation.isPending}
            onClick={handleCreate}
          >
            Skrá fyrirtæki
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
