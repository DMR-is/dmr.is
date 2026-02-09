'use client'

import { useEffect, useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { createUserInput } from '../../lib/inputs'

type Props = {
  intiallyVisible?: boolean
  isCreatingUser?: boolean
  shouldReset?: boolean
  shouldClose?: boolean
  onCreateUser?: (user: {
    nationalId: string
    email: string
    phone?: string
  }) => void
}

const intialState = {
  nationalId: '',
  email: '',
  phone: undefined,
}

export const CreateUserModal = ({
  intiallyVisible = false,
  isCreatingUser,
  shouldClose,
  shouldReset,
  onCreateUser,
}: Props) => {
  const [state, setState] = useState(intialState)
  const [visible, setVisible] = useState(intiallyVisible)

  const disclosure = (
    <Button
      circle
      size="small"
      icon="add"
      iconType="outline"
      title="Bæta við notanda"
      onClick={() => setVisible((prev) => !prev)}
    />
  )

  useEffect(() => {
    if (shouldReset) {
      setState(intialState)
    }
  }, [shouldReset])

  useEffect(() => {
    if (shouldClose) {
      setVisible(false)
    }
  }, [shouldClose])

  const updateState = (key: string, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const isDisabled = createUserInput.safeParse(state).success === false

  return (
    <Modal
      baseId="create-user-modal"
      disclosure={disclosure}
      isVisible={visible}
      onVisibilityChange={setVisible}
      title="Bæta við ritstjóra"
      toggleClose={() => setVisible(false)}
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              required
              name="new-user-national-id"
              label="Kennitala"
              onChange={(e) => updateState('nationalId', e.target.value)}
              value={state.nationalId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              required
              name="new-user-email"
              label="Netfang"
              onChange={(e) => updateState('email', e.target.value)}
              value={state.email}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              name="new-user-phone"
              label="Sími"
              onChange={(e) => updateState('phone', e.target.value)}
              value={state.phone}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Inline align={['left', 'right']}>
              <Button
                disabled={isDisabled}
                loading={isCreatingUser}
                icon="add"
                variant="ghost"
                onClick={() => {
                  if (onCreateUser) {
                    onCreateUser({
                      nationalId: state.nationalId,
                      email: state.email,
                      phone: state.phone,
                    })
                  }
                }}
              >
                Stofna ritstjóra
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Modal>
  )
}
