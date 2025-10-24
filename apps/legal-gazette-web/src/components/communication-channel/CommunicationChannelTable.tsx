import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { CommunicationChannelDto } from '../../gen/fetch'
import { UpdateCommunicationChannel } from './UpdateCommunicationChannel'

type Props = {
  advertId: string
  channels: CommunicationChannelDto[]
}

export const CommunicationChannelTable = ({ advertId, channels }: Props) => {
  const columns = [
    {
      field: 'email',
      children: 'Netfang',
    },
    {
      field: 'name',
      children: 'Nafn',
    },
    {
      field: 'phone',
      children: 'Símanúmer',
    },
  ]

  const rows = channels.map((channel) => ({
    isExpandable: true,
    children: (
      <UpdateCommunicationChannel advertId={advertId} channel={channel} />
    ),
    email: channel.email,
    name: channel.name,
    phone: channel.phone,
  }))

  return <DataTable columns={columns} rows={[...rows]} />
}
