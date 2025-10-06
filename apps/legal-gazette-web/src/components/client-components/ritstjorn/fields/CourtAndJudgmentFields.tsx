'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Select,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AccordionItem, toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'
import {
  isBankruptcyRecallAdvert,
  isDeceasedRecallAdvert,
  isDivisionEndingAdvert,
} from '../../../../lib/advert-type-guards'

export const CourtAndJudgementFields = () => {
  const { advert, courtDistricts } = useAdvertContext()

  const { trigger } = useUpdateAdvert(advert.id)

  const isRecallBankruptcy = isBankruptcyRecallAdvert(advert)
  const isRecallDeceased = isDeceasedRecallAdvert(advert)
  const isDivisionEnding = isDivisionEndingAdvert(advert)

  const isAnyOfThese =
    isRecallBankruptcy || isRecallDeceased || isDivisionEnding

  if (!isAnyOfThese) {
    return null
  }

  const courtDistrictOptions = courtDistricts?.map((district) => ({
    label: district.title,
    value: district.id,
  }))

  const defaultCourtDistrict =
    courtDistrictOptions?.find(
      (option) => option.value === advert.courtDistrict?.id,
    ) || null

  return (
    <AccordionItem id="court" label="Dómstóll og úrskurðardagur">
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Select
              size="sm"
              backgroundColor="blue"
              label="Dómstóll"
              options={courtDistrictOptions}
              defaultValue={defaultCourtDistrict}
              onChange={(opt) => {
                if (!opt) return

                trigger(
                  {
                    courtDistrictId: opt.value,
                  },
                  {
                    onSuccess: () =>
                      toast.success('Dómstóll vistaður', {
                        toastId: 'court-success',
                      }),
                    onError: () =>
                      toast.error('Villa við að vista dómstól', {
                        toastId: 'court-error',
                      }),
                  },
                )
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <DatePicker
              size="sm"
              locale="is"
              backgroundColor="blue"
              placeholderText=""
              label="Úrskurðardagur"
              selected={
                advert.judgementDate ? new Date(advert.judgementDate) : null
              }
              handleChange={(date) => {
                trigger(
                  {
                    judgementDate: date ? date.toISOString() : undefined,
                  },
                  {
                    onSuccess: () =>
                      toast.success('Úrskurðadagur vistaður', {
                        toastId: 'judgement-success',
                      }),
                    onError: () =>
                      toast.error('Villa við að vista úrskurðardag', {
                        toastId: 'judgement-error',
                      }),
                  },
                )
              }}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </AccordionItem>
  )
}
