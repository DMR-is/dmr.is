import { Box, LinkV2, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import * as styles from './Attachments.css'

type Props = {
  activeCase: Case
}

export const Attachments = ({ activeCase }: Props) => {
  return (
    <Box borderRadius="large" padding={[2, 3, 5]} background="purple100">
      <Text variant="h5">Athugasemdir</Text>
      {activeCase.advert.attachments.map((a, i) => {
        return (
          <Box
            key={i}
            display="flex"
            justifyContent="spaceBetween"
            alignItems="center"
            padding={[1, 2, 3]}
            borderBottomWidth="standard"
            borderColor="purple200"
          >
            <Text>{a.name}</Text>

            <LinkV2 href={a.url}>
              <Text whiteSpace="nowrap">Sækja skjal</Text>
            </LinkV2>
          </Box>
        )
      })}
    </Box>
  )
}
