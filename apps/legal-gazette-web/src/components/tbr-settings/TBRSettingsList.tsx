import { Tag } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { TBRCompanySettingsItemDto } from '../../gen/fetch'

type Props = {
  items: TBRCompanySettingsItemDto[]
}

type Column = React.ComponentProps<typeof DataTable>['columns'][number]

export const TBRSettingsList = ({ items }: Props) => {
  const columns: Column[] = [
    {
      field: 'name',
      children: 'Nafn',
    },
    {
      field: 'nationalId',
      children: 'Kennitala',
    },
    {
      field: 'email',
      children: 'Netfang',
    },
    {
      field: 'phone',
      children: 'Sími',
    },
    {
      field: 'status',
      children: 'Staða',
    },
  ]

  const rows = items.map((item) => ({
    id: item.id,
    name: item.name,
    nationalId: item.nationalId,
    email: item.email || '-',
    phone: item.phone || '-',
    status: (
      <Tag variant={item.active ? 'mint' : 'rose'}>
        {item.active ? 'Virkur' : 'Óvirkur'}
      </Tag>
    ),
  }))

  return <DataTable columns={columns} rows={rows} />
}
