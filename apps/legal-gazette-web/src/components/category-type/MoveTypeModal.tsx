'use client'

import { useEffect, useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { CategoryOverviewDto, TypeOverviewDto } from '../../gen/fetch'

export type MovePayload = {
  fromTypeId: string
  fromCategoryId?: string
  toTypeId?: string
  toCategoryId?: string
}

type Props = {
  isVisible: boolean
  fromType: TypeOverviewDto | null
  types: TypeOverviewDto[]
  categories: CategoryOverviewDto[]
  impact?: number
  previewing?: boolean
  moving?: boolean
  onPreview: (payload: MovePayload) => void
  onConfirm: (payload: MovePayload) => void
  onTargetChange: () => void
  onClose: () => void
}

type Option = { label: string; value: string }

export const MoveTypeModal = ({
  isVisible,
  fromType,
  types,
  categories,
  impact,
  previewing,
  moving,
  onPreview,
  onConfirm,
  onTargetChange,
  onClose,
}: Props) => {
  const [toTypeId, setToTypeId] = useState<string | undefined>()
  const [toCategoryId, setToCategoryId] = useState<string | undefined>()

  useEffect(() => {
    if (isVisible) {
      setToTypeId(undefined)
      setToCategoryId(undefined)
    }
  }, [isVisible, fromType])

  if (!fromType) return null

  const payload: MovePayload = {
    fromTypeId: fromType.id,
    toTypeId,
    toCategoryId,
  }

  const hasTarget = Boolean(toTypeId || toCategoryId)

  const typeOptions: Option[] = types
    .filter((t) => t.id !== fromType.id)
    .map((t) => ({ label: t.title, value: t.id }))
  const categoryOptions: Option[] = categories.map((c) => ({
    label: c.title,
    value: c.id,
  }))

  return (
    <Modal
      baseId="move-type-modal"
      isVisible={isVisible}
      onVisibilityChange={(next) => {
        if (!next) onClose()
      }}
      title={`Færa auglýsingar af tegund „${fromType.title}“`}
      toggleClose={onClose}
    >
      <GridContainer>
        <GridRow rowGap={[2, 3]}>
          <GridColumn span="12/12">
            <Text variant="small">
              Veldu tegund og/eða flokk sem auglýsingarnar eiga að færast í.
              Reiknaðu áhrifin áður en þú staðfestir.
            </Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Select
              size="sm"
              backgroundColor="blue"
              label="Ný tegund"
              placeholder="Óbreytt"
              isClearable
              options={typeOptions}
              value={typeOptions.find((o) => o.value === toTypeId) ?? null}
              onChange={(opt) => {
                setToTypeId(opt?.value)
                onTargetChange()
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Select
              size="sm"
              backgroundColor="blue"
              label="Nýr flokkur"
              placeholder="Óbreytt"
              isClearable
              options={categoryOptions}
              value={categoryOptions.find((o) => o.value === toCategoryId) ?? null}
              onChange={(opt) => {
                setToCategoryId(opt?.value)
                onTargetChange()
              }}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Stack space={2}>
              {impact !== undefined && (
                <AlertMessage
                  type={impact > 0 ? 'warning' : 'info'}
                  title={`${impact} auglýsingar`}
                  message={
                    impact > 0
                      ? `${impact} auglýsingar munu færast við þessa aðgerð.`
                      : 'Engar auglýsingar verða fyrir áhrifum.'
                  }
                />
              )}
              <GridRow>
                <GridColumn span={['12/12', '6/12']}>
                  <Button
                    variant="ghost"
                    fluid
                    disabled={!hasTarget}
                    loading={previewing}
                    onClick={() => onPreview(payload)}
                  >
                    Reikna áhrif
                  </Button>
                </GridColumn>
                <GridColumn span={['12/12', '6/12']}>
                  <Button
                    fluid
                    disabled={!hasTarget || impact === undefined}
                    loading={moving}
                    onClick={() => onConfirm(payload)}
                  >
                    Staðfesta færslu
                  </Button>
                </GridColumn>
              </GridRow>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Modal>
  )
}
