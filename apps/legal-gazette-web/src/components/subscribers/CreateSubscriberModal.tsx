'use client'

import { useEffect, useState } from 'react'

import {
  Button,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Input,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { createSubscriberInput } from '../../lib/inputs'

type Props = {
  initiallyVisible?: boolean
  isCreatingSubscriber?: boolean
  shouldReset?: boolean
  shouldClose?: boolean
  onCreateSubscriber?: (subscriber: {
    nationalId: string
    email?: string
    subscribedTo: string
  }) => void
}

const getDefaultEndDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date
}

const intialState = {
  nationalId: '',
  email: '',
  subscribedTo: getDefaultEndDate(),
}

export const CreateSubscriberModal = ({
  initiallyVisible = false,
  isCreatingSubscriber,
  shouldClose,
  shouldReset,
  onCreateSubscriber,
}: Props) => {
  const [state, setState] = useState(intialState)
  const [visible, setVisible] = useState(initiallyVisible)

  const disclosure = (
    <Button
      circle
      size="small"
      icon="add"
      iconType="outline"
      title="Bæta við áskrifanda"
      onClick={() => setVisible((prev) => !prev)}
    />
  )

  useEffect(() => {
    if (shouldReset) {
      setState({ ...intialState, subscribedTo: getDefaultEndDate() })
    }
  }, [shouldReset])

  useEffect(() => {
    if (shouldClose) {
      setVisible(false)
    }
  }, [shouldClose])

  const updateState = (key: string, value: string | Date) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const isDisabled =
    createSubscriberInput.safeParse({
      nationalId: state.nationalId,
      email: state.email || undefined,
      subscribedTo: state.subscribedTo.toISOString(),
    }).success === false

  return (
    <Modal
      baseId="create-subscriber-modal"
      disclosure={disclosure}
      isVisible={visible}
      onVisibilityChange={setVisible}
      title="Bæta við áskrifanda"
      allowOverflow={true}
      toggleClose={() => setVisible(false)}
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              required
              name="new-subscriber-national-id"
              label="Kennitala"
              onChange={(e) => updateState('nationalId', e.target.value)}
              value={state.nationalId}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              name="new-subscriber-email"
              label="Netfang"
              onChange={(e) => updateState('email', e.target.value)}
              value={state.email}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              label="Áskrift til"
              placeholderText="Veldu dagsetningu"
              selected={state.subscribedTo}
              handleChange={(date) => updateState('subscribedTo', date)}
              locale="is"
              backgroundColor="blue"
              size="sm"
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Inline align={['left', 'right']}>
              <Button
                disabled={isDisabled}
                loading={isCreatingSubscriber}
                icon="add"
                variant="ghost"
                onClick={() => {
                  if (onCreateSubscriber) {
                    onCreateSubscriber({
                      nationalId: state.nationalId,
                      email: state.email || undefined,
                      subscribedTo: state.subscribedTo.toISOString(),
                    })
                  }
                }}
              >
                Stofna áskrifanda
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Modal>
  )
}
