import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { CommunicationChannelDto } from '../../gen/fetch'

type Props = {
  channels: CommunicationChannelDto[]
}

export const CommunicationChannelTable = ({ channels }: Props) => {
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
    email: channel.email,
    name: channel.name,
    phone: channel.phone,
  }))

  return <DataTable columns={columns} rows={rows} />
}
