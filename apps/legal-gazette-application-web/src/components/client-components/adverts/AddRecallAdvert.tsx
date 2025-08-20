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
  ModalBase,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { CreateRecallAdvertForApplicationDto } from '../../../gen/fetch'
import { createRecallAdvertForApplication } from '../../../lib/fetchers'
import { Center } from '../center/Center'
type Props = {
  caseId: string
  isVisible?: boolean
  onVisibilityChange?: (isVisible: boolean) => void
}

export const AddRecallAdvert = ({
  caseId,
  isVisible,
  onVisibilityChange,
}: Props) => {
  const router = useRouter()

  const [meetingDate, setMeetingDate] = useState<Date | null>(null)

  const { trigger, isMutating } = useSWRMutation(
    'createRecallAdvertForApplication',
    (_key, { arg }: { arg: CreateRecallAdvertForApplicationDto }) =>
      createRecallAdvertForApplication({
        caseId,
        createRecallAdvertForApplicationDto: arg,
      }),
    {
      onSuccess: () => {
        toast.success('Innköllun hefur verið bætt við.')

        router.refresh()

        onVisibilityChange?.(false)
      },
      onError: (error) => {
        toast.error(error.message, {
          toastId: 'create-recall-advert-error',
        })
      },
    },
  )

  return (
    <ModalBase
      baseId="add-recall-advert-modal"
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
                      <Text variant="h3">Bæta við innköllun</Text>
                      <button onClick={closeModal}>
                        <Icon icon="close" />
                      </button>
                    </Inline>
                    <Stack space={[3, 4]}>
                      <DatePicker
                        locale="is"
                        backgroundColor="blue"
                        size="sm"
                        minDate={new Date()}
                        selected={meetingDate}
                        handleChange={setMeetingDate}
                        label={'Dagsetning innköllunar'}
                        placeholderText={undefined}
                      />
                      <Inline align="right">
                        <Button
                          loading={isMutating}
                          variant="utility"
                          icon="add"
                          disabled={!meetingDate}
                          onClick={() => {
                            if (!meetingDate) {
                              toast.error('Vinsamlegast fylltu út alla reiti.')
                              return
                            }
                            return trigger({
                              scheduledAt: meetingDate.toISOString(),
                            })
                          }}
                        >
                          Bæta við innköllun
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
