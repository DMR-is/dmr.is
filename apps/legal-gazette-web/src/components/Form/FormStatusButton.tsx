import dynamic from 'next/dynamic'

import useSWRMutation from 'swr/mutation'

import { Button, Stack, toast } from '@island.is/island-ui/core'

import {
  AdvertStatusDto,
  AdvertStatusIdEnum,
  DeleteCaseRequest,
  UpdateAdvertStatusRequest,
} from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { swrFetcher } from '../../lib/api/fetcher'

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod.TextInput),
)

type Props = {
  advertId: string
  caseId: string
  status: AdvertStatusDto
  onStatusChange?: () => void
}

export const FormStatusButton = ({
  advertId,
  caseId,
  status,
  onStatusChange,
}: Props) => {
  const advertClient = getLegalGazetteClient('AdvertApi', 'todo:add-token')
  const caseClient = getLegalGazetteClient('CaseApi', 'todo:add-token')
  const { trigger: updateStatusTrigger } = useSWRMutation(
    'updateAdvertStatus',
    (_key: string, { arg }: { arg: UpdateAdvertStatusRequest }) =>
      swrFetcher({
        func: () => advertClient.updateAdvertStatus(arg),
      }),
    {
      onSuccess: () => {
        toast.success('Staða auglýsingar var uppfærð.', {
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
    (_key: string, { arg }: { arg: DeleteCaseRequest }) =>
      swrFetcher({
        func: () => caseClient.deleteCase(arg),
      }),
    {
      onSuccess: () => {
        toast.success('Auglýsingu var hafnað.', {
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
    status.id === AdvertStatusIdEnum.SUBMITTED ||
    status.id === AdvertStatusIdEnum.READY_FOR_PUBLICATION

  return (
    <Stack space={2}>
      <TextInput
        name="advert-status"
        value={status.title}
        label="Staða"
        disabled
      />
      {status.id === AdvertStatusIdEnum.SUBMITTED ? (
        <Button
          onClick={() =>
            updateStatusTrigger({
              id: advertId,
              statusId: AdvertStatusIdEnum.READY_FOR_PUBLICATION,
            })
          }
          size="small"
          icon="arrowForward"
          fluid
        >
          Færa mál í útgáfu
        </Button>
      ) : status.id === AdvertStatusIdEnum.READY_FOR_PUBLICATION ? (
        <Button
          onClick={() =>
            updateStatusTrigger({
              id: advertId,
              statusId: AdvertStatusIdEnum.SUBMITTED,
            })
          }
          variant="ghost"
          size="small"
          preTextIcon="arrowBack"
          fluid
        >
          Færa mál í Innsent
        </Button>
      ) : status.id === AdvertStatusIdEnum.WITHDRAWN ? (
        <Button
          disabled
          variant="ghost"
          size="small"
          preTextIcon="arrowBack"
          fluid
        >
          Mál dregið til baka
        </Button>
      ) : status.id === AdvertStatusIdEnum.REJECTED ? (
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
