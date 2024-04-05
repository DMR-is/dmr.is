import { Box, Icon, LinkV2, Stack, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import * as styles from './Attachments.css'
import { messages } from './messages'
type Props = {
  activeCase: Case
}

export const Attachments = ({ activeCase }: Props) => {
  const { formatMessage } = useFormatMessage()
  return (
    <Box>
      <Text variant="h5">{formatMessage(messages.attachments.title)}</Text>

      <Box
        marginTop={2}
        borderRadius="large"
        padding={[2, 3]}
        borderWidth="standard"
        borderColor="blue200"
      >
        <Stack space={2}>
          {activeCase.advert.attachments.map((a, i) => {
            return (
              <Box
                key={i}
                display="flex"
                justifyContent="spaceBetween"
                alignItems="center"
                padding={1}
                paddingRight={2}
                paddingLeft={2}
                borderWidth="standard"
                borderColor="blue200"
                background="blue100"
                borderRadius="large"
              >
                <Box display="flex" columnGap={2}>
                  <Icon
                    icon={a.type === 'signature' ? 'pencil' : 'attach'}
                    color="blue400"
                  />
                  <Text>{a.name}</Text>
                </Box>

                <LinkV2
                  href={a.url}
                  underline="normal"
                  color="blue400"
                  underlineVisibility="always"
                >
                  {formatMessage(messages.attachments.fetchFile)}{' '}
                  <Icon icon="download" color="blue400" type="outline" />
                </LinkV2>
              </Box>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
