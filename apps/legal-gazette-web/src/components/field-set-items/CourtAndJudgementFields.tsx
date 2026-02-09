'use client'

import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { CourtDistrictDto } from '../../gen/fetch'
import { useUpdateAdvert } from '../../hooks/useUpdateAdvert'

type CourtAndJudgementFieldsProps = {
  id: string
  courtDistrictId?: string
  courtDistricts?: CourtDistrictDto[]
  judgementDate?: string
  canEdit: boolean
}

export const CourtAndJudgementFields = ({
  id,
  courtDistrictId,
  courtDistricts,
  judgementDate,
  canEdit,
}: CourtAndJudgementFieldsProps) => {
  const { updateCourtDistrict, updateJudgementDay } = useUpdateAdvert(id)

  const courtDistrictOptions = courtDistricts?.map((district) => ({
    label: district.title,
    value: district.id,
  }))

  const defaultCourtDistrict =
    courtDistrictOptions?.find((option) => option.value === courtDistrictId) ||
    null

  const handleChangeCourtDistrict = (
    opt: { label: string; value: string } | null,
  ) => {
    if (opt?.value) {
      updateCourtDistrict?.(opt.value)
    }
  }

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span={['12/12', '6/12']}>
          <Select
            isDisabled={!canEdit}
            size="sm"
            backgroundColor="blue"
            label="Dómstóll"
            options={courtDistrictOptions}
            value={defaultCourtDistrict}
            onChange={handleChangeCourtDistrict}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            disabled={!canEdit}
            size="sm"
            locale="is"
            backgroundColor="blue"
            placeholderText=""
            label="Úrskurðardagur"
            selected={judgementDate ? new Date(judgementDate) : null}
            handleChange={(date) => {
              date?.toISOString() && updateJudgementDay(date?.toISOString())
            }}
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
