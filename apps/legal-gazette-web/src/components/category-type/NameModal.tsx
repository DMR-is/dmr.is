'use client'

import { useEffect, useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

type Props = {
  isVisible: boolean
  title: string
  label: string
  initialValue?: string
  submitting?: boolean
  onSubmit: (value: string) => void
  onClose: () => void
}

export const NameModal = ({
  isVisible,
  title,
  label,
  initialValue = '',
  submitting,
  onSubmit,
  onClose,
}: Props) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (isVisible) setValue(initialValue)
  }, [isVisible, initialValue])

  const trimmed = value.trim()

  return (
    <Modal
      baseId="category-type-name-modal"
      isVisible={isVisible}
      onVisibilityChange={(next) => {
        if (!next) onClose()
      }}
      title={title}
      toggleClose={() => onClose()}
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Input
              backgroundColor="blue"
              size="sm"
              required
              name="category-type-name"
              label={label}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Button
              onClick={() => onSubmit(trimmed)}
              disabled={trimmed.length === 0}
              loading={submitting}
            >
              Vista
            </Button>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Modal>
  )
}
