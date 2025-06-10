import { Button, Stack } from '@island.is/island-ui/core'

import { AdvertStatusDto, AdvertStatusIdEnum } from '../../gen/fetch'

type Props = {
  advertId: string
  status: AdvertStatusDto
}

export const FormStatusButton = ({ advertId, status }: Props) => {
  const canReject =
    status.id === AdvertStatusIdEnum.SUBMITTED ||
    status.id === AdvertStatusIdEnum.READY_FOR_PUBLICATION
  return (
    <Stack space={2}>
      {status.id === AdvertStatusIdEnum.SUBMITTED ? (
        <Button size="small" icon="arrowForward" fluid>
          Færa mál í útgáfu
        </Button>
      ) : status.id === AdvertStatusIdEnum.READY_FOR_PUBLICATION ? (
        <Button variant="ghost" size="small" preTextIcon="arrowBack" fluid>
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
        <Button colorScheme="destructive" size="small" icon="close" fluid>
          Hafna máli
        </Button>
      )}
    </Stack>
  )
}
