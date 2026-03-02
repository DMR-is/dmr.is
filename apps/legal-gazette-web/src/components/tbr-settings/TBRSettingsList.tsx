'use client'

import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { TbrSettingItem } from '../../lib/trpc/types'
import { CreateTBRSetting } from './CreateTBRSetting'
import { DeleteTBRSetting } from './DeleteTBRSetting'
import { TBRSettingInfo } from './TBRSettingInfo'
import { ToggleTBRSettingsStatus } from './ToggleTBRStatus'

import { useQueryClient } from '@tanstack/react-query'

type Props = {
  items: TbrSettingItem[]
}

export const TBRSettingsList = ({ items }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const columns = [
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
    {
      field: 'actions',
      children: <CreateTBRSetting />,
      size: 'tiny' as const,
    },
  ] as const

  const rows = items.map((item) => ({
    isExpandable: true,
    children: <TBRSettingInfo setting={item} />,
    name: item.name,
    nationalId: item.nationalId,
    uniqueKey: item.id,
    email: item.email || '-',
    phone: item.phone || '-',
    status: (
      <ToggleTBRSettingsStatus
        settingId={item.id}
        settingNationalId={item.nationalId}
        isActive={item.active}
      />
    ),
    actions: <DeleteTBRSetting settingName={item.name} settingId={item.id} />,
    onExpandChange: (expanded: boolean) => {
      // only invalidate when collapsing to refetch updated data
      if (!expanded) {
        queryClient.invalidateQueries(trpc.getTbrSettings.queryFilter())
      }
    },
  }))

  return <DataTable columns={columns} rows={rows} />
}
