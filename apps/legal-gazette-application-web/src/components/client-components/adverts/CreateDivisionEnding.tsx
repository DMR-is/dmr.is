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
} from '@island.is/island-ui/core'

import { AddDivisionEndingForApplicationDto } from '../../../gen/fetch'
import { trpc } from '../../../lib/trpc/client'
import { Center } from '../center/Center'

type Props = {
  isVisible: boolean
  onVisibilityChange: (isVisible: boolean) => void
}

export const CreateDivisionEnding = ({
  isVisible,
  onVisibilityChange,
}: Props) => {
  const { id } = useParams()
  const utils = trpc.useUtils()
  const { mutate: addDivisionEnding, isPending } =
    trpc.applicationApi.addDivisionEnding.useMutation()

  const [createState, setCreateState] =
    useState<AddDivisionEndingForApplicationDto>({
      declaredClaims: 0,
      signatureDate: '',
      signatureLocation: '',
      signatureName: '',
      signatureOnBehalfOf: '',
      additionalText: '',
      scheduledAt: '',
    })

  const canSubmit = Object.entries(createState)
    .filter(
      ([key]) => key !== 'signatureOnBehalfOf' && key !== 'additionalText',
    )
    .every(([key, value]) => {
      if (key === 'declaredClaims') {
        return value !== 0
      }

      return !!value
    })

  return (
    <ModalBase
      baseId="create-division-ending-modal"
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
    >
      {({ closeModal }) => (
        <Center fullHeight={true}>
          <GridContainer>
            <GridRow rowGap={[2, 3, 4]}>
              <GridColumn span={['12/12', '8/12']} offset={['0', '2/12']}>
                <Box padding={[2, 3, 4]} width="full" background="white">
                  <Inline
                    space={2}
                    alignY="center"
                    justifyContent="spaceBetween"
                  >
                    <Text marginBottom={[1, 2]} variant="h3">
                      Bæta við skiptalokum
                    </Text>
                    <button onClick={closeModal}>
                      <Icon icon="close" />
                    </button>
                  </Inline>
                  <Stack space={[2, 3]}>
                    <GridRow rowGap={[1, 2]}>
                      <GridColumn span="12/12">
                        <Text variant="h4">Birting og kröfur</Text>
                      </GridColumn>
                      <GridColumn span={['12/12', '6/12']}>
                        <DatePicker
                          size="sm"
                          locale="is"
                          backgroundColor="blue"
                          name="declaredClaims"
                          label="Birting"
                          placeholderText=""
                          handleChange={(date) =>
                            setCreateState({
                              ...createState,
                              scheduledAt: date.toISOString(),
                            })
                          }
                        />
                      </GridColumn>
                      <GridColumn span={['12/12', '6/12']}>
                        <Input
                          size="sm"
                          backgroundColor="blue"
                          type="number"
                          name="declaredClaims"
                          label="Lýstar kröfur"
                          onChange={(e) =>
                            setCreateState({
                              ...createState,
                              declaredClaims: Number(e.target.value),
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
                              signatureName: e.target.value,
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
                              signatureLocation: e.target.value,
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
                              signatureDate: date.toISOString(),
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
                              signatureOnBehalfOf: e.target.value,
                            })
                          }
                        />
                      </GridColumn>
                    </GridRow>
                    <GridRow>
                      <GridColumn span="12/12">
                        <Inline align="right" alignY="center">
                          <Button
                            disabled={!canSubmit}
                            icon="upload"
                            iconType="outline"
                            loading={isPending}
                            onClick={() => {
                              addDivisionEnding(
                                {
                                  applicationId: id as string,
                                  ...createState,
                                },
                                {
                                  onSuccess: () => {
                                    utils.applicationApi.getApplicationById.invalidate(
                                      {
                                        id: id as string,
                                      },
                                    )
                                    utils.advertsApi.getAdvertByCaseId.invalidate()
                                    toast.success('Skiptalokum bætt við', {
                                      toastId: 'add-division-ending-success',
                                    })
                                    closeModal()
                                  },
                                  onError: () =>
                                    toast.error(
                                      'Ekki tókst að bæta við skiptalokum',
                                      { toastId: 'add-division-ending-error' },
                                    ),
                                },
                              )
                            }}
                          >
                            Bæta við skiptalokum
                          </Button>
                        </Inline>
                      </GridColumn>
                    </GridRow>
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
