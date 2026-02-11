import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { CommunicationChannelDto } from '../../gen/fetch'
import { CommunicationChannelTable } from '../communication-channel/CommunicationChannelTable'

type Props = {
  advertId: string
  channels: CommunicationChannelDto[]
}

export const CommunicationChannelFields = ({ advertId, channels }: Props) => {
  return (
    <Stack space={2}>
      <CommunicationChannelTable advertId={advertId} channels={channels} />
    </Stack>
  )
}
