import { DataTable } from '@dmr.is/ui'

import { AccordionItem } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CommunicationChannelsField = ({ toggle, onToggle }: Props) => {
  const { currentCase } = useCaseContext()
  return (
    <AccordionItem
      id="communication-channel-fields"
      expanded={toggle}
      onToggle={onToggle}
      label="Samskiptaleiðir"
      labelVariant="h5"
      iconVariant="small"
    >
      <DataTable
        noDataMessage="Engar samskiptaleiðir skráðar"
        columns={[
          {
            field: 'name',
            children: 'Nafn',
          },
          {
            field: 'email',
            children: 'Netfang',
          },
          {
            field: 'phone',
            children: 'Símanúmer',
          },
        ]}
        rows={currentCase.channels.map((ch) => ({
          name: ch.name,
          email: ch.email,
          phone: ch.phone ? ch.phone : '-',
        }))}
      ></DataTable>
    </AccordionItem>
  )
}
