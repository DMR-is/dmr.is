'use client'

import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

import {
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Select,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import {
  BankruptcyApplicationDto,
  CourtDistrictDto,
  TypeEnum,
  UpdateBankruptcyApplicationDto,
} from '../../../gen/fetch'
import { updateBankruptcyApplication } from '../../../lib/fetchers'
import { ApplicationPublishingDates } from './ApplicationPublishingDates'

type Props = {
  initalState: BankruptcyApplicationDto
  locations: CourtDistrictDto[]
}

export const BankruptcyApplication = ({ initalState, locations }: Props) => {
  const [updateState, setUpdateState] =
    useState<UpdateBankruptcyApplicationDto>({
      additionalText: initalState.additionalText ?? undefined,
      courtDistrictId: initalState.courtDistrict?.id,
      judgmentDate: initalState?.judgmentDate ?? undefined,
      claimsSentTo: initalState.claimsSentTo ?? undefined,
      locationAddress: initalState.locationAddress ?? undefined,
      locationNationalId: initalState.locationNationalId ?? undefined,
      locationName: initalState.locationName ?? undefined,
      locationDeadline: initalState?.locationDeadline ?? undefined,
      signatureDate: initalState?.signatureDate ?? undefined,
      signatureLocation: initalState.signatureLocation ?? undefined,
      signatureName: initalState.signatureName ?? undefined,
      signatureOnBehalfOf: initalState.signatureOnBehalfOf ?? undefined,
      publishingDates: initalState?.publishingDates?.map((d) => d) ?? [
        new Date().toISOString(),
      ],
    })

  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.title,
  }))

  const { trigger } = useSWRMutation(
    ['updateApplication', updateState],
    ([_key, args]) => {
      const { caseId, id } = initalState
      return updateBankruptcyApplication({
        applicationId: id as string,
        caseId: caseId,
        updateBankruptcyApplicationDto: {
          ...args,
        },
      })
    },
    {
      onSuccess: () => {
        toast.success('Umsókn vistuð', {
          toastId: 'update-application-success',
        })
      },
      onError: (error) => {
        toast.error(`Villa við að vista umsókn: ${error}`, {
          toastId: 'update-application-error',
        })
      },
    },
  )

  return (
    <GridContainer>
      <input
        type="hidden"
        name="application-type"
        value={TypeEnum.InnköllunÞrotabús}
      />
      <Stack space={4}>
        <GridRow>
          <GridColumn span="12/12">
            <Text marginBottom={2} variant="h2">
              Innköllun þrotabús
            </Text>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h3">Grunnupplýsingar</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Select
              backgroundColor="blue"
              name="location"
              size="sm"
              label="Staður"
              value={locationOptions.find(
                (loc) => loc.value === updateState.courtDistrictId,
              )}
              options={locationOptions}
              onChange={(opt) =>
                setUpdateState((prev) => ({
                  ...prev,
                  courtDistrictId: opt?.value,
                }))
              }
              onBlur={() => trigger()}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              placeholderText=""
              size="sm"
              name="judgementDate"
              label="Úrskurðardagur"
              locale="is"
              minDate={new Date()}
              selected={
                updateState.judgmentDate
                  ? new Date(updateState.judgmentDate)
                  : undefined
              }
              handleChange={(date) => {
                setUpdateState((prev) => ({
                  ...prev,
                  judgmentDate: date ? date.toISOString() : undefined,
                }))
              }}
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Input
              backgroundColor="blue"
              size="sm"
              label="Frjáls texti"
              name="addtional-text"
              defaultValue={initalState?.additionalText ?? undefined}
              onChange={(e) =>
                setUpdateState((prev) => ({
                  ...prev,
                  additionalText: e.target.value,
                }))
              }
              onBlur={() => trigger()}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h3">Upplýsingar um þrotabúið</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Nafn bús"
              name="locationName"
              defaultValue={initalState?.locationName ?? undefined}
              onChange={(e) =>
                setUpdateState((prev) => ({
                  ...prev,
                  locationName: e.target.value,
                }))
              }
              onBlur={() => trigger()}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Kennitala bús"
              name="locationNationalId"
              defaultValue={initalState?.locationNationalId ?? undefined}
              onChange={(e) =>
                setUpdateState((prev) => ({
                  ...prev,
                  locationNationalId: e.target.value,
                }))
              }
              onBlur={() => trigger()}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Heimilisfang"
              name="locationAddress"
              defaultValue={initalState?.locationAddress ?? undefined}
              onChange={(e) =>
                setUpdateState((prev) => ({
                  ...prev,
                  locationAddress: e.target.value,
                }))
              }
              onBlur={() => trigger()}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              placeholderText=""
              size="sm"
              name="locationDeadline"
              label="Frestur til að skila kröfum"
              locale="is"
              minDate={new Date()}
              selected={
                updateState.locationDeadline
                  ? new Date(updateState.locationDeadline)
                  : undefined
              }
              handleChange={(date) => {
                setUpdateState((prev) => ({
                  ...prev,
                  locationDeadline: date ? date.toISOString() : undefined,
                }))

                trigger()
              }}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h3">Birting</Text>
          </GridColumn>
          <GridColumn span="12/12">
            <ApplicationPublishingDates
              publishingDates={updateState.publishingDates as string[]}
              onDateChange={(dates) => {
                setUpdateState((prev) => ({
                  ...prev,
                  publishingDates: dates,
                }))

                setTimeout(() => {
                  trigger()
                }, 100)
              }}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}
