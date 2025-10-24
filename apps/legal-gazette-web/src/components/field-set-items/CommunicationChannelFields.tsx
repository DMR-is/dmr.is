import { Stack } from '@dmr.is/ui/components/island-is'

import { CommunicationChannelDto } from '../../gen/fetch'
import { CommunicationChannelTable } from '../communication-channel/CommunicationChannelTable'

type Props = {
  channels: CommunicationChannelDto[]
}

export const CommunicationChannelFields = ({ channels }: Props) => {
  return (
    <Stack space={2}>
      <CommunicationChannelTable channels={channels} />
    </Stack>
  )
}
