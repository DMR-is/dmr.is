'use client'

import isEqual from 'lodash/isEqual'
import { useEffect, useState } from 'react'
import { Key } from 'swr'
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
  ApiErrorDto,
  BankruptcyApplicationDto,
  CourtDistrictDto,
  TypeEnum,
  UpdateBankruptcyApplicationDto,
  UpdateBankruptcyApplicationRequest,
} from '../../../../gen/fetch'
import { updateBankruptcyApplication } from '../../../../lib/fetchers'
import { ApplicationPublishingDates } from '../ApplicationPublishingDates'

type Props = {
  initalApplication: BankruptcyApplicationDto
  locations: CourtDistrictDto[]
}

export const BankruptcyApplication = ({
  initalApplication,
  locations,
}: Props) => {
  const [updateState, setUpdateState] =
    useState<UpdateBankruptcyApplicationDto>({
      additionalText: initalApplication.additionalText,
      courtDistrictId: initalApplication.courtDistrict?.id,
      judgmentDate: initalApplication.judgmentDate,
      settlementName: initalApplication.settlementName,
      settlementNationalId: initalApplication.settlementNationalId,
      settlementAddress: initalApplication.settlementAddress,
      settlementDeadline: initalApplication.settlementDeadline,
      publishingDates: initalApplication.publishingDates,
      liquidator: initalApplication.liquidator,
      liquidatorLocation: initalApplication.liquidatorLocation,
      liquidatorOnBehalfOf: initalApplication.liquidatorOnBehalfOf,
      settlementMeetingDate: initalApplication.settlementMeetingDate,
      settlementMeetingLocation: initalApplication.settlementMeetingLocation,
      signatureDate: initalApplication.signatureDate,
      signatureLocation: initalApplication.signatureLocation,
    })

  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.title,
  }))

  const { trigger: updateApplicationTrigger } = useSWRMutation<
    void,
    ApiErrorDto,
    Key,
    UpdateBankruptcyApplicationRequest
  >(
    'updateApplication',
    (_key: string, { arg }: { arg: UpdateBankruptcyApplicationRequest }) =>
      updateBankruptcyApplication(arg),
    {
      onSuccess: () => {
        toast.success('Umsókn vistuð', {
          toastId: 'update-application-success',
        })
      },
      onError: () => {
        toast.error(`Villa við að vista umsókn`, {
          toastId: 'update-application-error',
        })
      },
    },
  )

  const trigger = (args: UpdateBankruptcyApplicationDto) => {
    const incomingChanges = { ...updateState, ...args }

    const hasChanges = !isEqual(incomingChanges, updateState)

    // check args are the same as the current state
    if (!hasChanges) {
      return
    }

    setUpdateState((prev) => ({
      ...prev,
      ...args,
    }))

    updateApplicationTrigger({
      applicationId: initalApplication.id,
      caseId: initalApplication.caseId,
      updateBankruptcyApplicationDto: args,
    })
  }

  return (
    <GridContainer>
      <input
        type="hidden"
        name="application-type"
        value={TypeEnum.InnköllunÞrotabús}
      />
      <input type="hidden" name="application-id" value={initalApplication.id} />
      <input type="hidden" name="case-id" value={initalApplication.caseId} />
      <Stack space={4}>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={1}>
              <Text variant="h2">Innköllun þrotabús</Text>
              <Text marginBottom={2}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Text>
            </Stack>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Grunnupplýsingar</Text>
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
              onChange={(opt) => trigger({ courtDistrictId: opt?.value })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              backgroundColor="blue"
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
              handleChange={(date) =>
                trigger({
                  judgmentDate: date ? date.toISOString() : undefined,
                })
              }
            />
          </GridColumn>
          <GridColumn span="12/12">
            <Input
              backgroundColor="blue"
              size="sm"
              label="Frjáls texti"
              name="addtional-text"
              defaultValue={initalApplication?.additionalText ?? undefined}
              onBlur={(e) =>
                trigger({
                  additionalText: e.target.value,
                })
              }
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Upplýsingar um þrotabúið</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Nafn bús"
              name="locationName"
              defaultValue={initalApplication?.settlementName ?? undefined}
              onBlur={(e) => trigger({ settlementName: e.target.value })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Kennitala bús"
              name="locationNationalId"
              defaultValue={
                initalApplication?.settlementNationalId ?? undefined
              }
              onBlur={(e) =>
                trigger({
                  settlementNationalId: e.target.value,
                })
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Heimilisfang"
              name="locationAddress"
              defaultValue={initalApplication?.settlementAddress ?? undefined}
              onBlur={(e) => trigger({ settlementAddress: e.target.value })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              backgroundColor="blue"
              placeholderText=""
              size="sm"
              name="locationDeadline"
              label="Frestur til að skila kröfum"
              locale="is"
              minDate={new Date()}
              selected={
                updateState.settlementDeadline
                  ? new Date(updateState.settlementDeadline)
                  : undefined
              }
              handleChange={(date) =>
                trigger({
                  settlementDeadline: date ? date.toISOString() : undefined,
                })
              }
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Upplýsingar um skiptastjóra</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Skiptastjóri"
              name="liquidator"
              defaultValue={initalApplication?.liquidator ?? undefined}
              onBlur={(e) => trigger({ liquidator: e.target.value })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Staðsetning skiptastjóra"
              name="liquidatorLocation"
              defaultValue={initalApplication?.liquidatorLocation ?? undefined}
              onBlur={(e) => trigger({ liquidatorLocation: e.target.value })}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="f.h. skiptastjóra"
              name="liquidatorOnBehalfOf"
              defaultValue={
                initalApplication?.liquidatorOnBehalfOf ?? undefined
              }
              onBlur={(e) =>
                trigger({
                  liquidatorOnBehalfOf: e.target.value,
                })
              }
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Upplýsingar um skiptafund</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              placeholderText=""
              backgroundColor="blue"
              size="sm"
              name="settlementMeetingDate"
              label="Dagsetning skiptafundar"
              locale="is"
              minDate={new Date()}
              selected={
                updateState.settlementMeetingDate
                  ? new Date(updateState.settlementMeetingDate)
                  : undefined
              }
              handleChange={(date) =>
                trigger({
                  settlementMeetingDate: date ? date.toISOString() : undefined,
                })
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Staðsetning skiptafundar"
              name="settlementMeetingLocation"
              defaultValue={
                initalApplication?.settlementMeetingLocation ?? undefined
              }
              onBlur={(e) =>
                trigger({
                  settlementMeetingLocation: e.target.value,
                })
              }
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Undirritun</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <DatePicker
              backgroundColor="blue"
              placeholderText=""
              size="sm"
              name="signatureDate"
              label="Dagsetning undirritunar"
              locale="is"
              minDate={new Date()}
              selected={
                updateState.signatureDate
                  ? new Date(updateState.signatureDate)
                  : undefined
              }
              handleChange={(date) =>
                trigger({
                  signatureDate: date ? date.toISOString() : undefined,
                })
              }
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12', '6/12']}>
            <Input
              backgroundColor="blue"
              size="sm"
              label="Staðsetning undirritunar"
              name="signatureLocation"
              defaultValue={initalApplication?.signatureLocation ?? undefined}
              onBlur={(e) => trigger({ signatureLocation: e.target.value })}
            />
          </GridColumn>
        </GridRow>
        <GridRow rowGap={3}>
          <GridColumn span="12/12">
            <Text variant="h4">Birting</Text>
          </GridColumn>
          <GridColumn span="12/12">
            <ApplicationPublishingDates
              publishingDates={updateState.publishingDates as string[]}
              onDateChange={(dates) => trigger({ publishingDates: dates })}
            />
          </GridColumn>
        </GridRow>
      </Stack>
    </GridContainer>
  )
}
