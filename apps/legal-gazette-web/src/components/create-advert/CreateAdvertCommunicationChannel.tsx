import { useState } from 'react'
import * as z from 'zod'

import { communicationChannelSchemaRefined } from '@dmr.is/legal-gazette/schemas'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

type CommunicationChannelItems = z.infer<
  typeof communicationChannelSchemaRefined
>

type Props = {
  onChange: (channels: CommunicationChannelItems) => void
}

export const CreateAdvertCommunicationChannel = ({ onChange }: Props) => {
  const [state, setState] = useState<CommunicationChannelItems>([])

  const columns = [
    {
      field: 'email',
      children: 'Netfang',
      size: 'default' as const,
    },
    {
      field: 'name',
      children: 'Nafn',
      size: 'default' as const,
    },
    {
      field: 'phone',
      children: 'Símanúmer',
      size: 'default' as const,
    },
    {
      field: 'actions',
      size: 'tiny' as const,
      children: (
        <Button
          size="small"
          circle
          icon="add"
          iconType="outline"
          onClick={() => {
            const newChannel = { email: '', name: '', phone: '' }
            const updated = [...state, newChannel]
            setState(updated)
            onChange(updated)
          }}
        />
      ),
    },
  ]

  const rows = state.map((channel) => ({
    email: (
      <Input
        label="Netfang"
        size="sm"
        backgroundColor="blue"
        name="channel.email"
        value={channel.email}
        onChange={(e) => {
          const updated = state.map((c) =>
            c === channel ? { ...c, email: e.target.value } : c,
          )
          setState(updated)
          onChange(updated)
        }}
      />
    ),
    name: (
      <Input
        label="Nafn"
        size="sm"
        backgroundColor="blue"
        name="channel.name"
        value={channel.name}
        onChange={(e) => {
          const updated = state.map((c) =>
            c === channel ? { ...c, name: e.target.value } : c,
          )
          setState(updated)
          onChange(updated)
        }}
      />
    ),
    phone: (
      <Input
        label="Símanúmer"
        size="sm"
        backgroundColor="blue"
        name="channel.phone"
        value={channel.phone}
        onChange={(e) => {
          const updated = state.map((c) =>
            c === channel ? { ...c, phone: e.target.value } : c,
          )
          setState(updated)
          onChange(updated)
        }}
      />
    ),
    actions: (
      <Button
        size="small"
        circle
        colorScheme="destructive"
        icon="trash"
        onClick={() => {
          const filtered = state.filter((c) => c !== channel)
          setState(filtered)
          onChange(filtered)
        }}
      />
    ),
  }))

  return (
    <>
      <GridColumn span="12/12">
        <Text variant="h4">Samskiptaleiðir</Text>
      </GridColumn>
      <GridColumn span="12/12">
        <DataTable
          noDataMessage="Engar samskiptaleiðir valdar"
          columns={columns}
          rows={rows}
        />
      </GridColumn>
    </>
  )
}
