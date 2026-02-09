import { isNotEmpty } from 'class-validator'
import { useEffect, useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { updateUserInput } from '../../lib/inputs'

type Props = {
  intiallyVisible?: boolean
  isUpdatingUser?: boolean
  shouldReset?: boolean
  shouldClose?: boolean
  onUpdateUser?: (user: { email?: string; phone?: string }) => void
}

const initialState = {
  email: undefined,
  phone: undefined,
}

export const UpdateUserModal = ({
  intiallyVisible,
  isUpdatingUser,
  shouldReset,
  shouldClose,
  onUpdateUser,
}: Props) => {
  const [state, setState] = useState(initialState)
  const [visible, setVisible] = useState(intiallyVisible)

  useEffect(() => {
    if (shouldReset) {
      setState(initialState)
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

  const disclosure = (
    <Button
      circle
      variant="ghost"
      size="small"
      title="Uppfæra notanda"
      icon="pencil"
    />
  )

  const isEmailOrPhoneProvided =
    isNotEmpty(state.email) || isNotEmpty(state.phone)
  const isDisabled =
    updateUserInput.omit({ userId: true }).safeParse(state).success === false

  return (
    <Modal
      baseId="update-user"
      disclosure={disclosure}
      title="Uppfæra notanda"
      onVisibilityChange={setVisible}
      toggleClose={() => setVisible(false)}
      isVisible={visible}
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]} marginBottom={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              name="new-user-email"
              label="Netfang"
              onChange={(e) => updateState('email', e.target.value)}
              value={state.email}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              type="tel"
              backgroundColor="blue"
              size="sm"
              name="new-user-phone"
              label="Sími"
              onChange={(e) => updateState('phone', e.target.value)}
              value={state.phone}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Inline align={['left', 'right']}>
              <Button
                disabled={isDisabled || !isEmailOrPhoneProvided}
                loading={isUpdatingUser}
                icon="add"
                variant="ghost"
                onClick={() => {
                  if (onUpdateUser) {
                    onUpdateUser({
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
