'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Select,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { CourtDistrictDto } from '../../../../gen/fetch'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'

type CourtAndJudgementFieldsProps = {
  id: string
  courtDistrictId?: string
  courtDistricts?: CourtDistrictDto[]
  judgementDate?: string
}

export const CourtAndJudgementFields = ({
  id,
  courtDistrictId,
  courtDistricts,
  judgementDate,
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
            size="sm"
            backgroundColor="blue"
            label="Dómstóll"
            options={courtDistrictOptions}
            defaultValue={defaultCourtDistrict}
            onChange={handleChangeCourtDistrict}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
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
