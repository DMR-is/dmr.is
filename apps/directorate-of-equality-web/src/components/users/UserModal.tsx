'use client'

import { useEffect, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { ToggleSwitchButton } from '@dmr.is/ui/components/island-is/ToggleSwitchButton'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { type UserDto } from '../../gen/fetch/types.gen'
import { sharedText, usersText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const u = usersText.modal
const f = sharedText.form

type Props = {
  user: UserDto | null
  isOpen: boolean
  onClose: () => void
}

export const UserModal = ({ user, isOpen, onClose }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [nationalId, setNationalId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (user) {
      setNationalId('')
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setPhone(user.phone ?? '')
      setIsActive(user.isActive)
    } else {
      setNationalId('')
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setIsActive(true)
    }
  }, [user])

  const { mutate: createUser, isPending: isCreating } = useMutation(
    trpc.user.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() })
        toast.success(u.createSuccess)
        onClose()
      },
    }),
  )

  const { mutate: updateUser, isPending: isUpdating } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.list.queryKey() })
        toast.success(u.saveSuccess)
        onClose()
      },
    }),
  )

  const isNew = !user
  const isSaving = isCreating || isUpdating

  const handleSave = () => {
    if (isNew) {
      createUser({
        nationalId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        role: 'EDITOR',
      })
    } else {
      updateUser({
        id: user.id,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        isActive,
      })
    }
  }

  return (
    <Modal
      baseId="user-modal"
      isVisible={isOpen}
      title={isNew ? u.createTitle : u.editTitle}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      <Stack space={3}>
        {isNew && (
          <TextInput
            name="nationalId"
            label={u.nationalIdLabel}
            size="xs"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        )}

        <Inline space={2}>
          <Box flexGrow={1}>
            <TextInput
              name="firstName"
              label={u.firstNameLabel}
              size="xs"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Box>
          <Box flexGrow={1}>
            <TextInput
              name="lastName"
              label={u.lastNameLabel}
              size="xs"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Box>
        </Inline>

        <TextInput
          name="email"
          label={f.emailLabel}
          type="email"
          size="xs"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          name="phone"
          label={f.phoneShortLabel}
          size="xs"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {!isNew && (
          <Box>
            <Text variant="eyebrow" marginBottom={1}>
              {u.statusEyebrow}
            </Text>

            <ToggleSwitchButton
              expander
              label={u.activeLabel}
              checked={isActive}
              onChange={() => setIsActive((prev) => !prev)}
              onFocus={undefined}
              onBlur={undefined}
            />
          </Box>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" size="small" onClick={onClose}>
            {f.cancel}
          </Button>
          <Button
            size="small"
            loading={isSaving}
            disabled={
              isSaving ||
              !firstName.trim() ||
              !lastName.trim() ||
              !email.trim() ||
              (isNew && !nationalId.trim())
            }
            onClick={handleSave}
          >
            {isNew ? u.create : u.save}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
