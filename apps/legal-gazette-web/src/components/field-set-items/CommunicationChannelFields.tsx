import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { AdvertChannel } from '../../lib/trpc/types'
import { CommunicationChannelTable } from '../communication-channel/CommunicationChannelTable'

type Props = {
  advertId: string
  channels: AdvertChannel[]
}

export const CommunicationChannelFields = ({ advertId, channels }: Props) => {
  return (
    <Stack space={2}>
      <CommunicationChannelTable advertId={advertId} channels={channels} />
    </Stack>
  )
}
