'use client'

import addYears  from 'date-fns/addYears'
import get from 'lodash/get'
import { useEffect, useState } from 'react'

import { createDivisionEndingInput } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  Button,
  DatePicker,
  GridColumn,
  GridContainer,
  GridRow,
  Icon,
  Inline,
  Input,
  ModalBase,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/date'

import { CreateDivisionEndingDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { Center } from '../center/Center'
import { DivisionSignatureFields } from '../form/fields/DivisionSignatureFields'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  applicationId: string
  title?: string
  isVisible: boolean
  onVisibilityChange(isVisible: boolean): void
}

export const CreateDivisionEnding = ({
  applicationId,
  title,
  isVisible,
  onVisibilityChange,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: addDivisionEnding, isPending } = useMutation(
    trpc.addDivisionEnding.mutationOptions(),
  )

  const { data } = useQuery(
    trpc.getMininumDateForDivisionMeeting.queryOptions({
      applicationId: applicationId,
    }),
  )

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

  const [submitClicked, setSubmitClicked] = useState(false)

  const [formState, setFormState] = useState<CreateDivisionEndingDto>({
    declaredClaims: -1,
    additionalText: '',
    meetingDate: '',
    communicationChannels: [],
    signature: {
      date: undefined,
      location: '',
      name: '',
      onBehalfOf: '',
    },
  })

  const [fieldErrors, setFieldErrors] = useState<
    { [key: string]: string[] } | undefined
  >(undefined)

  useEffect(() => {
    if (submitClicked) {
      setAndGetFormValidation()
    }
  }, [formState])

  const setAndGetFormValidation = async () => {
    const formValidation = createDivisionEndingInput.safeParse(formState)
    const formErrors = formValidation.error?.flatten().fieldErrors

    setFieldErrors(formErrors)

    return formValidation
  }

  const validateAndSubmit = async () => {
    setSubmitClicked(true)
    const formValidation = await setAndGetFormValidation()

    if (formValidation.success) {
      addDivisionEnding(
        {
          applicationId: applicationId,
          ...formState,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(trpc.getAdvertByCaseId.queryFilter())
            toast.success('Skiptalokum bætt við', {
              toastId: 'add-division-ending-success',
            })
            onVisibilityChange(false)
          },
          onError: () =>
            toast.error('Ekki tókst að bæta við skiptalokum', {
              toastId: 'add-division-ending-error',
            }),
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
      baseId="create-division-ending-modal"
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
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
                    <Stack space={[2, 3]}>
                      <Stack space={0}>
                        <Inline
                          space={2}
                          alignY="center"
                          justifyContent="spaceBetween"
                        >
                          <Text variant="h3">Bæta við skiptalokum</Text>
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
                      <Stack space={[2, 3]}>
                        <GridRow rowGap={[1, 2]}>
                          <GridColumn span="12/12">
                            <Text variant="h4">Birting og kröfur</Text>
                          </GridColumn>
                          <GridColumn span={['12/12', '6/12']}>
                            <DatePicker
                              minDate={minDate}
                              maxDate={maxDate}
                              excludeDates={invalidPublishingDates}
                              maxYear={addYears(new Date(), 3).getFullYear()}
                              minYear={new Date().getFullYear()}
                              required
                              size="sm"
                              locale="is"
                              backgroundColor="blue"
                              name="declaredClaims"
                              label="Birting"
                              placeholderText=""
                              errorMessage={fieldErrors?.scheduledAt?.[0]}
                              handleChange={(date) =>
                                setFormState({
                                  ...formState,
                                  meetingDate: date.toISOString(),
                                })
                              }
                            />
                          </GridColumn>
                          <GridColumn span={['12/12', '6/12']}>
                            <Input
                              required
                              size="sm"
                              backgroundColor="blue"
                              type="number"
                              name="declaredClaims"
                              label="Lýstar kröfur"
                              errorMessage={fieldErrors?.declaredClaims?.[0]}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? Number(e.target.value)
                                  : -1
                                setFormState({
                                  ...formState,
                                  declaredClaims: value,
                                })
                              }}
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
                            <Inline align="right" alignY="center">
                              <Button
                                type="submit"
                                icon="add"
                                iconType="outline"
                                loading={isPending}
                              >
                                Bæta við skiptalokum
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
