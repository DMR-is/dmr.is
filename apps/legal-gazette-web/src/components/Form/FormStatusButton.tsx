import dynamic from 'next/dynamic'

import useSWRMutation from 'swr/mutation'

import { Button, Stack, toast } from '@island.is/island-ui/core'

import { StatusDto, StatusIdEnum } from '../../gen/fetch'
import { rejectCase, setAdvertStatus } from '../../lib/api/fetchers'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

type Props = {
  advertId: string
  caseId: string
  status: StatusDto
  onStatusChange?: () => void
}

export const FormStatusButton = ({
  advertId,
  caseId,
  status,
  onStatusChange,
}: Props) => {
  const { trigger: updateStatusTrigger } = useSWRMutation(
    'updateAdvertStatus',
    setAdvertStatus,
    {
      onSuccess: () => {
        toast.success('Staða auglýsingar uppfærð.', {
          toastId: 'update-advert-status-success',
        })

        onStatusChange?.()
      },
      onError: () => {
        toast.error('Villa kom upp við að uppfæra stöðu auglýsingar.', {
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
        toast.success('Auglýsingu hafnað.', {
          toastId: 'reject-advert-success',
        })

        onStatusChange?.()
      },
      onError: () => {
        toast.error('Villa kom upp við að hafna auglýsingu.', {
          toastId: 'reject-advert-error',
        })
      },
    },
  )

  const canReject =
    status.id === StatusIdEnum.SUBMITTED ||
    status.id === StatusIdEnum.READY_FOR_PUBLICATION

  return (
    <Stack space={2}>
      <TextInput
        name="advert-status"
        value={status.title}
        label="Staða"
        disabled
      />
      {status.id === StatusIdEnum.SUBMITTED ? (
        <Button
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
          Færa mál í útgáfu
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
          Færa mál í Innsent
        </Button>
      ) : status.id === StatusIdEnum.WITHDRAWN ? (
        <Button
          disabled
          variant="ghost"
          size="small"
          preTextIcon="arrowBack"
          fluid
        >
          Mál dregið til baka
        </Button>
      ) : status.id === StatusIdEnum.REJECTED ? (
        <Button disabled size="small" colorScheme="destructive" fluid>
          Mál hafnað
        </Button>
      ) : (
        <Button
          disabled
          variant="ghost"
          size="small"
          preTextIcon="arrowBack"
          fluid
        >
          Mál útgefið
        </Button>
      )}

      {canReject && (
        <Button
          onClick={() => rejectCaseTrigger({ id: caseId })}
          colorScheme="destructive"
          size="small"
          icon="close"
          fluid
        >
          Hafna máli
        </Button>
      )}
    </Stack>
  )
}
