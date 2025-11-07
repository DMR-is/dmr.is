import { useParams } from 'next/navigation'

import { useState } from 'react'

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

import { AddDivisionMeetingForApplicationDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { Center } from '../center/Center'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  isVisible: boolean
  onVisibilityChange: (isVisible: boolean) => void
}

export const CreateDivisionMeeting = ({
  isVisible,
  onVisibilityChange,
}: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { id: applicationId } = useParams()
  const { mutate: addDivisionMeeting, isPending } = useMutation(
    trpc.applicationApi.addDivisionMeeting.mutationOptions(),
  )

  const [createState, setCreateState] =
    useState<AddDivisionMeetingForApplicationDto>({
      additionalText: '',
      meetingDate: '',
      meetingLocation: '',
      signature: {
        date: '',
        location: '',
        name: '',
        onBehalfOf: '',
      },
    })

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
          <GridContainer>
            <GridRow rowGap={[2, 3, 4]}>
              <GridColumn span={['12/12', '8/12']} offset={['0', '2/12']}>
                <Box padding={[2, 3, 4]} width="full" background="white">
                  <Stack space={[3, 4]}>
                    <Stack space={[1, 2]}>
                      <Inline
                        align="right"
                        alignY="center"
                        justifyContent="spaceBetween"
                        space={[1, 2]}
                      >
                        <Text variant="h3">Bæta við skiptafundi</Text>
                        <button onClick={closeModal}>
                          <Icon icon="close" />
                        </button>
                      </Inline>
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
                              setCreateState({
                                ...createState,
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
                            onChange={(e) =>
                              setCreateState({
                                ...createState,
                                meetingLocation: e.target.value,
                              })
                            }
                          />
                        </GridColumn>
                        <GridColumn span={['12/12', '6/12']}>
                          <DatePicker
                            locale="is"
                            required
                            name="meetingDate"
                            backgroundColor="blue"
                            label="Dagsetning og tími skiptafundar"
                            size="sm"
                            timeInputLabel="Klukkan"
                            showTimeInput={true}
                            placeholderText=""
                            handleChange={(date) =>
                              setCreateState({
                                ...createState,
                                meetingDate: date.toISOString(),
                              })
                            }
                          />
                        </GridColumn>
                      </GridRow>
                      <GridRow rowGap={[1, 2]}>
                        <GridColumn span="12/12">
                          <Text variant="h4">Undirritun</Text>
                        </GridColumn>
                        <GridColumn span={['12/12', '6/12']}>
                          <Input
                            required
                            name="signatureName"
                            backgroundColor="blue"
                            size="sm"
                            label="Nafn undirritara"
                            onChange={(e) =>
                              setCreateState({
                                ...createState,
                                signature: {
                                  ...createState.signature,
                                  name: e.target.value,
                                },
                              })
                            }
                          />
                        </GridColumn>
                        <GridColumn span={['12/12', '6/12']}>
                          <Input
                            required
                            name="signatureLocation"
                            backgroundColor="blue"
                            size="sm"
                            label="Staðsetning undirritunar"
                            onChange={(e) =>
                              setCreateState({
                                ...createState,
                                signature: {
                                  ...createState.signature,
                                  location: e.target.value,
                                },
                              })
                            }
                          />
                        </GridColumn>
                        <GridColumn span={['12/12', '6/12']}>
                          <DatePicker
                            locale="is"
                            required
                            name="signatureDate"
                            backgroundColor="blue"
                            label="Dagsetning undirritunar"
                            size="sm"
                            placeholderText=""
                            handleChange={(date) =>
                              setCreateState({
                                ...createState,
                                signature: {
                                  ...createState.signature,
                                  date: date.toISOString(),
                                },
                              })
                            }
                          />
                        </GridColumn>
                        <GridColumn span={['12/12', '6/12']}>
                          <Input
                            name="signatureOnBehalfOf"
                            backgroundColor="blue"
                            size="sm"
                            label="Fyrir hönd undirritara"
                            onChange={(e) =>
                              setCreateState({
                                ...createState,
                                signature: {
                                  ...createState.signature,
                                  onBehalfOf: e.target.value,
                                },
                              })
                            }
                          />
                        </GridColumn>
                      </GridRow>
                      <GridRow>
                        <GridColumn span="12/12">
                          <Inline alignY="center" align="right" space={2}>
                            <Button
                              loading={isPending}
                              icon="share"
                              iconType="outline"
                              onClick={() =>
                                addDivisionMeeting(
                                  {
                                    applicationId: applicationId as string,
                                    ...createState,
                                  },
                                  {
                                    onSuccess: () => {
                                      queryClient.invalidateQueries(trpc.advertsApi.getAdvertByCaseId.queryFilter({ caseId: applicationId as string }))
                                      setCreateState({
                                        additionalText: '',
                                        meetingDate: '',
                                        meetingLocation: '',
                                        signature: {
                                          date: '',
                                          location: '',
                                          name: '',
                                          onBehalfOf: '',
                                        },
                                      })
                                      toast.success('Skiptafundur stofnaður', {
                                        toastId: 'create-division-meeting',
                                      })
                                      closeModal()
                                    },
                                    onError: () => {
                                      toast.error(
                                        'Ekki tókst að stofna skiptafund, reyndu aftur síðar',
                                        { toastId: 'create-division-meeting' },
                                      )
                                    },
                                  },
                                )
                              }
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
        </Center>
      )}
    </ModalBase>
  )
}
