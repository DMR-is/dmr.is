import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { CommunicationChannelDto } from '../../gen/fetch'
import { CreateCommunicationChannel } from './CreateCommunicationChannel'
import { DeleteCommunicationChannel } from './DeleteCommunicationChannel'
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
    {
      field: 'options',
      children: <CreateCommunicationChannel advertId={advertId} />,
      size: 'tiny' as const,
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
    options: (
      <DeleteCommunicationChannel advertId={advertId} channelId={channel.id} />
    ),
  }))

  return (
    <DataTable
      columns={columns}
      rows={[...rows]}
      noDataMessage="Engar samskiptaleiðir fundust"
    />
  )
}
