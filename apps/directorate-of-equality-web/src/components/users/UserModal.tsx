'use client'

import { useEffect, useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { type UserDto } from '../../gen/fetch/types.gen'

type Props = {
  user: UserDto | null
  isOpen: boolean
  onClose: () => void
}

export const UserModal = ({ user, isOpen, onClose }: Props) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setPhone(user.phone ?? '')
      setIsActive(user.isActive)
    } else {
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setIsActive(true)
    }
  }, [user])

  const handleSave = () => {
    // TODO: wire up update mutation when API endpoint is available
    onClose()
  }

  const isNew = !user

  return (
    <Modal
      baseId="user-modal"
      isVisible={isOpen}
      title={isNew ? 'Nýr ritstjóri' : 'Breyta ritstjóra'}
      onVisibilityChange={(visible) => {
        if (!visible) onClose()
      }}
      toggleClose={onClose}
      width="small"
    >
      <Stack space={3}>
        <Inline space={2}>
          <Box flexGrow={1}>
            <TextInput
              name="firstName"
              label="Fornafn"
              size="xs"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Box>
          <Box flexGrow={1}>
            <TextInput
              name="lastName"
              label="Eftirnafn"
              size="xs"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Box>
        </Inline>

        <TextInput
          name="email"
          label="Netfang"
          type="email"
          size="xs"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          name="phone"
          label="Sími"
          size="xs"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {!isNew && (
          <Box>
            <Text variant="eyebrow" marginBottom={1}>
              Staða ritstjóra
            </Text>
            <Checkbox
              name="isActive"
              label="Virkur ritstjóri"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </Box>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" size="small" onClick={onClose}>
            Hætta við
          </Button>
          <Button
            size="small"
            disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
            onClick={handleSave}
          >
            {isNew ? 'Stofna ritstjóra' : 'Vista breytingar'}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
