import { useState } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  ApplicationInputFields,
  BaseApplicationSchema,
  CommunicationChannelSchema,
} from '@dmr.is/legal-gazette/schemas'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Icon,
  Inline,
  Input,
  Stack,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { useUpdateApplication } from '../../../../hooks/useUpdateApplication'

export const CommunicationChannelFields = () => {
  const { getValues, setValue, watch } = useFormContext<BaseApplicationSchema>()

  const { updateCommunicationChannels } = useUpdateApplication(
    getValues(ApplicationInputFields.APPLICATION_ID),
  )

  const channels: CommunicationChannelSchema[] = watch(
    ApplicationInputFields.COMMUNICATION_CHANNELS,
    [],
  )

  const [toggleAdd, setToggleAdd] = useState(false)
  const [isEditing, setIsEditing] = useState('')

  const [currentChannel, setCurrentChannel] =
    useState<CommunicationChannelSchema>({
      email: '',
      name: undefined,
      phone: undefined,
    })

  const isEmailAlreadyAdded = channels.some(
    (channel) =>
      channel.email === currentChannel.email && channel.email !== isEditing,
  )

  const addChannel = (
    channel: CommunicationChannelSchema,
    isEditing: string,
  ) => {
    if (isEditing) {
      const channelToEditIndex = channels.findIndex(
        (c) => c.email === isEditing,
      )
      if (channelToEditIndex > -1) {
        channels[channelToEditIndex] = channel
      }
    } else {
      channels.push(channel)
    }

    setValue(ApplicationInputFields.COMMUNICATION_CHANNELS, channels, {
      shouldValidate: true,
    })
    updateCommunicationChannels(channels)
    setToggleAdd(false)
    setIsEditing('')
    setCurrentChannel({ email: '', name: '', phone: '' })
  }

  const removeChannel = (index: number) => {
    const updatedChannels = channels.filter((_, i) => i !== index)
    setValue(ApplicationInputFields.COMMUNICATION_CHANNELS, updatedChannels)
    updateCommunicationChannels(updatedChannels)
  }

  return (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <Text variant="h3">Samskiptaleiðir</Text>
      </GridColumn>
      <GridColumn span="12/12">
        <Stack space={[2, 3]}>
          {toggleAdd && (
            <Box background="blue100" padding={[2, 3]} borderRadius="large">
              <Stack space={[1, 2]}>
                <Text variant="h4">Bæta við samskiptaleið</Text>
                <GridContainer>
                  <Stack space={[2, 3]}>
                    <GridRow>
                      <GridColumn span={['12/12', '8/12']}>
                        <Stack space={[1, 2]}>
                          <Input
                            required
                            label="Netfang"
                            size="sm"
                            name="email"
                            placeholder="Netfang"
                            value={currentChannel.email}
                            onChange={(e) =>
                              setCurrentChannel({
                                ...currentChannel,
                                email: e.target.value,
                              })
                            }
                          />
                          <Input
                            label="Nafn"
                            size="sm"
                            name="name"
                            placeholder="Nafn"
                            value={currentChannel.name}
                            onChange={(e) =>
                              setCurrentChannel({
                                ...currentChannel,
                                name: e.target.value,
                              })
                            }
                          />
                        </Stack>
                      </GridColumn>
                      <GridColumn span={['12/12', '4/12']}>
                        <Input
                          label="Símanúmer"
                          size="sm"
                          name="phone"
                          placeholder="Símanúmer"
                          value={currentChannel.phone}
                          onChange={(e) =>
                            setCurrentChannel({
                              ...currentChannel,
                              phone: e.target.value,
                            })
                          }
                        />
                      </GridColumn>
                    </GridRow>
                    <GridRow>
                      <GridColumn span="12/12">
                        <Inline
                          justifyContent="spaceBetween"
                          alignY="center"
                          space={2}
                        >
                          <Button
                            onClick={() => {
                              setToggleAdd(false)
                              setIsEditing('')
                              setCurrentChannel({
                                email: '',
                                name: '',
                                phone: '',
                              })
                            }}
                            size="small"
                            variant="ghost"
                            icon="close"
                          >
                            Hætta við
                          </Button>
                          <Button
                            onClick={() =>
                              addChannel({ ...currentChannel }, isEditing)
                            }
                            size="small"
                            icon="add"
                            disabled={
                              !currentChannel.email || isEmailAlreadyAdded
                            }
                          >
                            Bæta við
                          </Button>
                        </Inline>
                      </GridColumn>
                    </GridRow>
                  </Stack>
                </GridContainer>
              </Stack>
            </Box>
          )}
          {channels.length > 0 ? (
            <T.Table>
              <T.Head>
                <T.Row>
                  <T.HeadData>Netfang</T.HeadData>
                  <T.HeadData>Nafn</T.HeadData>
                  <T.HeadData>Símanúmer</T.HeadData>
                  <T.HeadData></T.HeadData>
                  <T.HeadData></T.HeadData>
                </T.Row>
              </T.Head>
              <T.Body>
                {channels.map((channel, index) => (
                  <T.Row key={index}>
                    <T.Data>{channel.email}</T.Data>
                    <T.Data>{channel.name}</T.Data>
                    <T.Data>{channel.phone}</T.Data>
                    <T.Data>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(channel.email)
                          setCurrentChannel(channel)
                          setToggleAdd(true)
                        }}
                      >
                        <Icon size="small" icon="pencil" color="blue400" />
                      </button>
                    </T.Data>
                    <T.Data>
                      <button
                        type="button"
                        onClick={() => removeChannel(index)}
                      >
                        <Icon
                          size="small"
                          icon="trash"
                          color="red400"
                          type="outline"
                        />
                      </button>
                    </T.Data>
                  </T.Row>
                ))}
              </T.Body>
            </T.Table>
          ) : (
            <Text>Engar samskiptaleiðir valdar</Text>
          )}
          <Button onClick={() => setToggleAdd(true)}>
            Bæta við samskiptaleið
          </Button>
        </Stack>
      </GridColumn>
    </GridRow>
  )
}
