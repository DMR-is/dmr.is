import { Box, Icon, LinkV2, Stack, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import * as styles from './Attachments.css'

type Props = {
  activeCase: Case
}

export const Attachments = ({ activeCase }: Props) => {
  return (
    <Box>
      <Text variant="h5">Fylgiskjöl</Text>

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
                  Sækja skjal{' '}
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
