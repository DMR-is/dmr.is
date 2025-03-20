import { useState } from 'react'
import { DataTable } from '@dmr.is/ui'

import {
  AccordionItem,
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  Stack,
  Text,
  toast,
} from '@island.is/island-ui/core'

import { CreateCaseChannelBody } from '../../gen/fetch'
import { useCommunicationChannels } from '../../hooks/api/get/useCommunicationChannels'
import { useCaseContext } from '../../hooks/useCaseContext'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const CommunicationChannelsField = ({ toggle, onToggle }: Props) => {
  const { currentCase, refetch } = useCaseContext()

  const { createChannel, deleteChannel } = useCommunicationChannels({
    createChannelOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Samskiptaleið hefur verið bætt við', {
          toastId: 'createChannel',
        })
        setCreateState({ name: '', email: '', phone: '' })
      },
      onError: () => {
        toast.error('Ekki tókst að bæta við samskiptaleið', {
          toastId: 'createChannelFailure',
        })
      },
    },
    deleteChannelOptions: {
      onSuccess: () => {
        refetch()
        toast.success('Samskiptaleið hefur verið eytt', {
          toastId: 'deleteChannel',
        })
      },
      onError: () => {
        toast.error('Ekki tókst að eyða samskiptaleið', {
          toastId: 'deleteChannelFailure',
        })
      },
    },
  })

  const [createState, setCreateState] = useState<CreateCaseChannelBody>({
    name: '',
    email: '',
    phone: '',
  })

  const handleChange = (key: keyof CreateCaseChannelBody, value: string) => {
    setCreateState((state) => ({ ...state, [key]: value }))
  }

  const canCreate = createState.name && createState.email

  return (
    <AccordionItem
      id="communication-channel-fields"
      expanded={toggle}
      onToggle={onToggle}
      label="Samskiptaleiðir"
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={3}>
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
            {
              field: 'delete',
              children: '',
              width: '50px',
            },
          ]}
          rows={currentCase.channels.map((ch) => ({
            name: ch.name,
            email: ch.email,
            phone: ch.phone ? ch.phone : '-',
            delete: (
              <Button
                variant="utility"
                size="small"
                icon="trash"
                iconType="outline"
                onClick={() =>
                  deleteChannel({ caseId: currentCase.id, channelId: ch.id })
                }
              />
            ),
          }))}
        />
        <Box>
          <Stack space={2}>
            <Text variant="medium" fontWeight="semiBold">
              Bæta við samskiptaleið
            </Text>
            <GridContainer>
              <GridRow>
                <GridColumn span={['12/12', '4/12']}>
                  <OJOIInput
                    required
                    label="Nafn samskiptaaðila"
                    name="create-channel-name"
                    value={createState.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </GridColumn>
                <GridColumn span={['12/12', '4/12']}>
                  <OJOIInput
                    required
                    label="Netfang samskiptaaðila"
                    name="create-channel-email"
                    value={createState.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </GridColumn>
                <GridColumn span={['12/12', '4/12']}>
                  <OJOIInput
                    label="Símanúmer samskiptaaðila"
                    name="create-channel-phone"
                    value={createState.phone}
                    placeholder="555 5555"
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </GridColumn>
              </GridRow>
            </GridContainer>
            <Inline justifyContent="flexEnd">
              <Button
                disabled={!canCreate}
                variant="utility"
                size="small"
                iconType="outline"
                icon="call"
                onClick={() =>
                  createChannel({
                    caseId: currentCase.id,
                    createCaseChannelBody: createState,
                  })
                }
              >
                Bæta við samskiptaleið
              </Button>
            </Inline>
          </Stack>
        </Box>
      </Stack>
    </AccordionItem>
  )
}
