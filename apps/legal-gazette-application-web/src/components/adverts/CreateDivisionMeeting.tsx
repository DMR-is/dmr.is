'use client'

import { addYears } from 'date-fns'
import get from 'lodash/get'
import { useEffect, useState } from 'react'

import { createDivisionMeetingInput } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { ModalBase } from '@dmr.is/ui/components/island-is/ModalBase'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/date'

import { CreateDivisionMeetingDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { Center } from '../center/Center'
import { DivisionSignatureFields } from '../form/fields/DivisionSignatureFields'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  applicationId: string
  title?: string
  isVisible: boolean
  onVisibilityChange: (isVisible: boolean) => void
}

const initFormState: CreateDivisionMeetingDto = {
  additionalText: '',
  communicationChannels: [],
  meetingDate: '',
  meetingLocation: '',
  signature: {
    date: undefined,
    location: '',
    name: '',
    onBehalfOf: '',
  },
}

export const CreateDivisionMeeting = ({
  applicationId,
  title,
  isVisible,
  onVisibilityChange,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { mutate: addDivisionMeeting, isPending } = useMutation(
    trpc.addDivisionMeeting.mutationOptions(),
  )

  const { data } = useQuery(
    trpc.getMininumDateForDivisionMeeting.queryOptions({
      applicationId: applicationId,
    }),
  )

  const [submitClicked, setSubmitClicked] = useState(false)

  const { data: application } = useQuery(
    trpc.getApplicationById.queryOptions({ id: applicationId }),
  )

  useEffect(() => {
    const communicationChannels = get(
      application?.answers,
      'communicationChannels',
      [],
    )

    setFormState((prev) => ({
      ...prev,
      communicationChannels: communicationChannels,
    }))
  }, [application?.answers])

  const [formState, setFormState] =
    useState<CreateDivisionMeetingDto>(initFormState)

  const [fieldErrors, setFieldErrors] = useState<
    { [key: string]: string[] } | undefined
  >(undefined)

  useEffect(() => {
    if (submitClicked) {
      setAndGetFormValidation()
    }
  }, [formState])

  const setAndGetFormValidation = async () => {
    const formValidation = createDivisionMeetingInput.safeParse(formState)
    const formErrors = formValidation.error?.flatten().fieldErrors

    setFieldErrors(formErrors)

    return formValidation
  }

  const validateAndSubmit = async () => {
    setSubmitClicked(true)
    const formValidation = await setAndGetFormValidation()

    if (formValidation.success) {
      addDivisionMeeting(
        {
          applicationId: applicationId,
          ...formState,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(trpc.getAdvertByCaseId.queryFilter())
            setSubmitClicked(false)
            setFormState({
              ...initFormState,
              communicationChannels: formState.communicationChannels,
            })

            toast.success('Skiptafundur stofnaður', {
              toastId: 'create-division-meeting',
            })
            onVisibilityChange(false)
          },
          onError: () => {
            toast.error('Ekki tókst að stofna skiptafund, reyndu aftur síðar', {
              toastId: 'create-division-meeting',
            })
          },
        },
      )
    }
  }

  const minDate = getNextValidPublishingDate(
    data?.minDate ? new Date(data.minDate) : new Date(),
  )

  const maxDate = getNextValidPublishingDate(addYears(new Date(), 3))

  const invalidPublishingDates = getInvalidPublishingDatesInRange(
    minDate,
    maxDate,
  )

  return (
    <ModalBase
      baseId="create-division-meeting"
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
      initialVisibility={isVisible}
      hideOnEsc={true}
    >
      {({ closeModal }) => (
        <Center fullHeight={true}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              validateAndSubmit()
            }}
          >
            <GridContainer>
              <GridRow rowGap={[2, 3, 4]}>
                <GridColumn span={['12/12', '8/12']} offset={['0', '2/12']}>
                  <Box padding={[2, 3, 4]} width="full" background="white">
                    <Stack space={[3, 4]}>
                      <Stack space={0}>
                        <Inline
                          align="right"
                          alignY="center"
                          justifyContent="spaceBetween"
                          space={[1, 2]}
                        >
                          <Text variant="h3">Bæta við skiptafundi</Text>

                          <button onClick={closeModal} type="button">
                            <Icon icon="close" />
                          </button>
                        </Inline>
                        {title && (
                          <Text variant="h4" fontWeight="medium">
                            {title}
                          </Text>
                        )}
                      </Stack>
                      <Stack space={[1, 2]}>
                        <GridRow>
                          <GridColumn span="12/12">
                            <Input
                              name="additionalText"
                              label="Frjáls texti"
                              textarea
                              backgroundColor="blue"
                              rows={4}
                              size="sm"
                              onChange={(e) =>
                                setFormState({
                                  ...formState,
                                  additionalText: e.target.value,
                                })
                              }
                            />
                          </GridColumn>
                        </GridRow>
                        <GridRow rowGap={[1, 2]}>
                          <GridColumn span="12/12">
                            <Text variant="h4">Skiptafundur</Text>
                          </GridColumn>
                          <GridColumn span={['12/12', '6/12']}>
                            <Input
                              required
                              name="meetingLocation"
                              backgroundColor="blue"
                              label="Staðsetning skiptafundar"
                              size="sm"
                              errorMessage={fieldErrors?.meetingLocation?.[0]}
                              onChange={(e) =>
                                setFormState({
                                  ...formState,
                                  meetingLocation: e.target.value,
                                })
                              }
                            />
                          </GridColumn>
                          <GridColumn span={['12/12', '6/12']}>
                            <DatePicker
                              locale="is"
                              required
                              excludeDates={invalidPublishingDates}
                              minDate={minDate}
                              maxDate={maxDate}
                              maxYear={addYears(new Date(), 3).getFullYear()}
                              minYear={new Date().getFullYear()}
                              name="meetingDate"
                              backgroundColor="blue"
                              label="Dagsetning og tími skiptafundar"
                              size="sm"
                              timeInputLabel="Klukkan"
                              showTimeInput={true}
                              placeholderText=""
                              selected={
                                formState.meetingDate
                                  ? new Date(formState.meetingDate)
                                  : null
                              }
                              errorMessage={fieldErrors?.meetingDate?.[0]}
                              handleChange={(date) =>
                                setFormState({
                                  ...formState,
                                  meetingDate: date.toISOString(),
                                })
                              }
                            />
                          </GridColumn>
                        </GridRow>
                        <DivisionSignatureFields
                          formState={formState}
                          setFormState={setFormState}
                          fieldErrors={fieldErrors}
                        />

                        <GridRow>
                          <GridColumn span="12/12">
                            <Inline alignY="center" align="right" space={2}>
                              <Button
                                type="submit"
                                loading={isPending}
                                icon="add"
                                iconType="outline"
                              >
                                Stofna skiptafund
                              </Button>
                            </Inline>
                          </GridColumn>
                        </GridRow>
                      </Stack>
                    </Stack>
                  </Box>
                </GridColumn>
              </GridRow>
            </GridContainer>
          </form>
        </Center>
      )}
    </ModalBase>
  )
}
