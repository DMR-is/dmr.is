import { Box, ResponsiveSpace, Text } from '@island.is/island-ui/core'

import { HTMLEditor } from '../editor/Editor'
import * as s from './AdvertDisplay.css'

export type AdvertDisplayProps = {
  advertNumber?: string
  signatureDate?: string
  advertType: string
  advertSubject: string
  advertText: string
  isLegacy: boolean
  paddingTop?: ResponsiveSpace
}

export const AdvertDisplay = ({
  advertNumber,
  signatureDate,
  advertType,
  advertSubject,
  advertText,
  isLegacy,
  paddingTop,
}: AdvertDisplayProps) => {
  if (!advertText) {
    return null
  }

  return (
    <Box
      border="standard"
      borderColor="purple200"
      borderRadius="large"
      padding={[2, 3, 4]}
      paddingTop={paddingTop}
      className={s.wrapper}
    >
      {(advertNumber || signatureDate) && (
        <Box
          display="flex"
          justifyContent="spaceBetween"
          marginBottom={[2, 3, 4]}
        >
          <Text variant="eyebrow" color="purple400">
            {advertNumber && `Nr. ${advertNumber}`}
          </Text>
          <Text variant="eyebrow" color="purple400">
            {signatureDate && `Undirritað: ${signatureDate}`}
          </Text>
        </Box>
      )}
      <Box textAlign="center" marginBottom={[2, 3, 4]}>
        <Text variant="intro">{advertType}</Text>
        <Text variant="h4">{advertSubject}</Text>
      </Box>
      {/* <Box
        className={isLegacy ? s.bodyText : s.bodyText}
        dangerouslySetInnerHTML={{ __html: advertText }}
      ></Box> */}
      <HTMLEditor defaultValue={advertText} readonly={true} />
    </Box>
  )
}
