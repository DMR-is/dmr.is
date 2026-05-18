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
    }
  }, [user])

  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    // TODO: wire up update mutation when API endpoint is available
    handleClose()
  }

  const isNew = !user

  return (
    <Modal
      baseId="user-modal"
      isVisible={isOpen}
      title={isNew ? 'Nýr notandi' : 'Breyta notanda'}
      onVisibilityChange={(visible) => {
        if (!visible) handleClose()
      }}
      toggleClose={handleClose}
      width="small"
    >
      <Stack space={3}>
        <Inline space={2}>
          <Box flexGrow={1}>
            <TextInput
              name="firstName"
              label="Fornafn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Box>
          <Box flexGrow={1}>
            <TextInput
              name="lastName"
              label="Eftirnafn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Box>
        </Inline>

        <TextInput
          name="email"
          label="Netfang"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextInput
          name="phone"
          label="Sími"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {!isNew && (
          <Box>
            <Text variant="eyebrow" marginBottom={1}>
              Staða notanda
            </Text>
            <Checkbox
              name="isActive"
              label="Virkur notandi"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </Box>
        )}

        <Inline justifyContent="flexEnd" space={2}>
          <Button variant="ghost" onClick={handleClose}>
            Hætta við
          </Button>
          <Button
            disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
            onClick={handleSave}
          >
            {isNew ? 'Stofna notanda' : 'Vista breytingar'}
          </Button>
        </Inline>
      </Stack>
    </Modal>
  )
}
