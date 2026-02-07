'use client'

import { useEffect, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

type Props = {
  initiallyVisible?: boolean
  isUpdatingSubscriber?: boolean
  shouldReset?: boolean
  shouldClose?: boolean
  currentEndDate?: string | null
  isActive?: boolean
  isActivating?: boolean
  isDeactivating?: boolean
  onUpdateSubscriber?: (data: { subscribedTo: string }) => void
  onActivate?: () => void
  onDeactivate?: () => void
}

export const UpdateSubscriberModal = ({
  initiallyVisible = false,
  isUpdatingSubscriber,
  shouldClose,
  shouldReset,
  currentEndDate,
  isActive,
  isActivating,
  isDeactivating,
  onUpdateSubscriber,
  onActivate,
  onDeactivate,
}: Props) => {
  const getInitialDate = () => {
    if (currentEndDate) {
      return new Date(currentEndDate)
    }
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date
  }

  const [subscribedTo, setSubscribedTo] = useState<Date>(getInitialDate())
  const [visible, setVisible] = useState(initiallyVisible)

  const disclosure = (
    <Button
      size="small"
      icon="pencil"
      iconType="outline"
      variant="utility"
      title="Breyta áskrift"
      onClick={() => setVisible((prev) => !prev)}
    />
  )

  useEffect(() => {
    if (shouldReset) {
      setSubscribedTo(getInitialDate())
    }
  }, [shouldReset, currentEndDate])

  useEffect(() => {
    if (shouldClose) {
      setVisible(false)
    }
  }, [shouldClose])

  return (
    <Modal
      baseId="update-subscriber-modal"
      disclosure={disclosure}
      isVisible={visible}
      onVisibilityChange={setVisible}
      title="Breyta áskrift"
      toggleClose={() => setVisible(false)}
      allowOverflow={true}
    >
      <Box>
        <GridContainer>
          <GridRow rowGap={[2, 3]}>
            <GridColumn span={['12/12', '5/12']}>
              <DatePicker
                label="Áskrift til"
                placeholderText="Veldu dagsetningu"
                selected={subscribedTo}
                handleChange={(date) => setSubscribedTo(date)}
                locale="is"
                backgroundColor="blue"
                size="sm"
              />
            </GridColumn>
            <GridColumn span={['12/12', '7/12']}>
              <Inline align={['left', 'right']} space={2}>
                <Button
                  loading={isUpdatingSubscriber}
                  icon="checkmark"
                  variant="ghost"
                  onClick={() => {
                    if (onUpdateSubscriber) {
                      onUpdateSubscriber({
                        subscribedTo: subscribedTo.toISOString(),
                      })
                    }
                  }}
                >
                  Uppfæra tímabil
                </Button>
                {isActive ? (
                  <Button
                    loading={isDeactivating}
                    icon="removeCircle"
                    iconType="outline"
                    variant="ghost"
                    colorScheme="destructive"
                    onClick={() => onDeactivate?.()}
                  >
                    Loka áskrift
                  </Button>
                ) : (
                  <Button
                    loading={isActivating}
                    icon="checkmarkCircle"
                    iconType="outline"
                    variant="ghost"
                    onClick={() => onActivate?.()}
                  >
                    Virkja áskrift
                  </Button>
                )}
              </Inline>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </Modal>
  )
}
