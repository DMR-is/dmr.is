'use client'
import { useRouter } from 'next/navigation'

import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

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

import { CreateDivisionEndingMeetingForApplicationDto } from '../../../gen/fetch'
import { createDivisionEndingForApplication } from '../../../lib/fetchers'
import { Center } from '../center/Center'
type Props = {
  caseId: string
  isVisible?: boolean
  onVisibilityChange?: (isVisible: boolean) => void
}

export const AddDivisionEnding = ({
  caseId,
  isVisible,
  onVisibilityChange,
}: Props) => {
  const router = useRouter()

  const [meetingDate, setMeetingDate] = useState<Date | null>(null)
  const [meetingLocation, setMeetingLocation] = useState<string>('')

  const { trigger, isMutating } = useSWRMutation(
    'createDivisionEndingAdvertForApplication',
    (_key, { arg }: { arg: CreateDivisionEndingMeetingForApplicationDto }) =>
      createDivisionEndingForApplication({
        caseId,
        createDivisionEndingMeetingForApplicationDto: arg,
      }),
    {
      onSuccess: () => {
        toast.success('Skiptalokum hefur verið bætt við.')

        router.refresh()

        onVisibilityChange?.(false)
      },
      onError: (error) => {
        toast.error(error.message, {
          toastId: 'create-division-ending-advert-error',
        })
      },
    },
  )

  return (
    <ModalBase
      baseId="add-division-ending-modal"
      isVisible={isVisible}
      onVisibilityChange={onVisibilityChange}
    >
      {({ closeModal }) => (
        <Center fullHeight={true}>
          <GridContainer>
            <GridRow>
              <GridColumn span={['12/12', '6/12']} offset={['0', '3/12']}>
                <Box padding={[3, 4]} background="white" borderRadius="large">
                  <Stack space={[3, 4]}>
                    <Inline
                      space={2}
                      justifyContent="spaceBetween"
                      alignY="center"
                    >
                      <Text variant="h3">Bæta við skiptalokum</Text>
                      <button onClick={closeModal}>
                        <Icon icon="close" />
                      </button>
                    </Inline>
                    <Stack space={[3, 4]}>
                      <Input
                        backgroundColor="blue"
                        size="sm"
                        name="new-division-ending-location"
                        label="Staðsetning skiptaloka"
                        value={meetingLocation}
                        onChange={(e) => setMeetingLocation(e.target.value)}
                      />
                      <DatePicker
                        locale="is"
                        showTimeInput
                        backgroundColor="blue"
                        size="sm"
                        minDate={new Date()}
                        selected={meetingDate}
                        handleChange={setMeetingDate}
                        label={'Dagsetning og tími skiptaloka'}
                        placeholderText={undefined}
                      />
                      <Inline align="right">
                        <Button
                          loading={isMutating}
                          variant="utility"
                          icon="add"
                          disabled={!meetingDate || !meetingLocation}
                          onClick={() => {
                            if (!meetingDate || !meetingLocation) {
                              toast.error('Vinsamlegast fylltu út alla reiti.')
                              return
                            }
                            return trigger({
                              meetingDate: meetingDate?.toISOString(),
                              meetingLocation: meetingLocation,
                            })
                          }}
                        >
                          Bæta við skiptalokum
                        </Button>
                      </Inline>
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
