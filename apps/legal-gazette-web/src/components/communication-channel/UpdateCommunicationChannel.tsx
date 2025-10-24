import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
} from '@dmr.is/ui/components/island-is'

import { CommunicationChannelDto } from '../../gen/fetch'
import { DeleteCommunicationChannel } from './DeleteCommunicationChannel'

type Props = {
  advertId: string
  channel: CommunicationChannelDto
}

export const UpdateCommunicationChannel = ({
  advertId,
  channel: communicationChannel,
}: Props) => {
  return (
    <Box paddingY={4} paddingX={2}>
      <GridContainer>
        <GridRow rowGap={3}>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Netfang"
              name="channel-email"
              defaultValue={communicationChannel.email}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Nafn"
              name="channel-name"
              defaultValue={communicationChannel.name}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Input
              size="sm"
              backgroundColor="blue"
              label="Símanúmer"
              name="channel-phone"
              defaultValue={communicationChannel.phone}
            />
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <DeleteCommunicationChannel
              advertId={advertId}
              channelId={communicationChannel.id}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
