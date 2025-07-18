'use client'

import { useIntl } from 'react-intl'
import useSWRMutation from 'swr/mutation'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'

import { AlertMessage, Button, Stack, toast } from '@island.is/island-ui/core'

import { StatusDto, StatusIdEnum } from '../../../gen/fetch'
import { useCaseContext } from '../../../hooks/cases/useCase'
import { rejectCase, setAdvertStatus } from '../../../lib/api/fetchers'
import { messages } from '../../../lib/messages/messages'
import { ritstjornSingleMessages } from '../../../lib/messages/ritstjorn/single'
import { toastMessages } from '../../../lib/messages/toast/messages'

type Props = {
  advertId: string
  caseId: string
  status: StatusDto
  publishable?: boolean
  onStatusChange?: () => void
}

export const FormStatusButton = ({
  advertId,
  caseId,
  status,
  publishable = false,
  onStatusChange,
}: Props) => {
  const { case: theCase } = useCaseContext()
  const { formatMessage } = useIntl()
  const { trigger: updateStatusTrigger } = useSWRMutation(
    'updateAdvertStatus',
    setAdvertStatus,
    {
      onSuccess: () => {
        toast.success(formatMessage(toastMessages.updateStatus.success), {
          toastId: 'update-advert-status-success',
        })

        onStatusChange?.()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.updateStatus.failure), {
          toastId: 'update-advert-status-error',
        })
      },
    },
  )

  const { trigger: rejectCaseTrigger } = useSWRMutation(
    'rejectAdvert',
    rejectCase,
    {
      onSuccess: () => {
        toast.success(formatMessage(toastMessages.rejectAdvert.success), {
          toastId: 'reject-advert-success',
        })

        onStatusChange?.()
      },
      onError: () => {
        toast.error(formatMessage(toastMessages.rejectAdvert.failure), {
          toastId: 'reject-advert-error',
        })
      },
    },
  )

  const hasSiblingBeenPublished = theCase.adverts.some(
    (advert) =>
      advert.id !== advertId &&
      advert.status.id === StatusIdEnum.PUBLISHED &&
      advert.publishedAt !== null,
  )

  const canReject =
    (status.id === StatusIdEnum.SUBMITTED ||
      status.id === StatusIdEnum.READY_FOR_PUBLICATION) &&
    !hasSiblingBeenPublished

  return (
    <Stack space={2}>
      <TextInput
        name="advert-status"
        value={status.title}
        label={formatMessage(ritstjornSingleMessages.formSidebar.status.label)}
        disabled
      />
      {status.id === StatusIdEnum.SUBMITTED ? (
        <Button
          disabled={!publishable}
          onClick={() =>
            updateStatusTrigger({
              id: advertId,
              statusId: StatusIdEnum.READY_FOR_PUBLICATION,
            })
          }
          size="small"
          icon="arrowForward"
          fluid
        >
          {formatMessage(
            ritstjornSingleMessages.formSidebar.buttons.moveToPublishing,
          )}
        </Button>
      ) : status.id === StatusIdEnum.READY_FOR_PUBLICATION ? (
        <Button
          onClick={() =>
            updateStatusTrigger({
              id: advertId,
              statusId: StatusIdEnum.SUBMITTED,
            })
          }
          variant="ghost"
          size="small"
          preTextIcon="arrowBack"
          fluid
        >
          {formatMessage(
            ritstjornSingleMessages.formSidebar.buttons.moveToSubmitted,
          )}
        </Button>
      ) : status.id === StatusIdEnum.WITHDRAWN ? (
        <AlertMessage
          title={formatMessage(messages.advertWithdrawn)}
          type="info"
        />
      ) : status.id === StatusIdEnum.REJECTED ? (
        <AlertMessage
          title={formatMessage(messages.advertRejected)}
          type="error"
        />
      ) : (
        <AlertMessage
          title={formatMessage(messages.advertPublished)}
          type="success"
        />
      )}

      {canReject && (
        <Button
          onClick={() => rejectCaseTrigger({ id: caseId })}
          colorScheme="destructive"
          size="small"
          icon="close"
          fluid
        >
          {formatMessage(
            ritstjornSingleMessages.formSidebar.buttons.rejectCase,
          )}
        </Button>
      )}
    </Stack>
  )
}
