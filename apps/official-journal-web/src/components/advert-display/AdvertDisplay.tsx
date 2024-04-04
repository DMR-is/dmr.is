import { Box, Text } from '@island.is/island-ui/core'

import * as s from './AdvertDisplay.css'

export type AdvertDisplayProps = {
  advertNumber?: string
  signatureDate?: string
  advertType: string
  advertSubject: string
  advertText: string
  isLegacy: boolean
}

export const AdvertDisplay = ({
  // advertNumber,
  // signatureDate,
  advertType,
  advertSubject,
  advertText,
  isLegacy,
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
      className={s.wrapper}
    >
      {/*(advertNumber || signatureDate) && (
        <Box
          display="flex"
          justifyContent="spaceBetween"
          marginBottom={[2, 3, 4]}
        >
          {advertNumber && (
            <Text variant="eyebrow" color="purple400">
              Nr. {advertNumber}
            </Text>
          )}
          {signatureDate && (
            <Text variant="eyebrow" color="purple400">
              Undirritað: {signatureDate}
            </Text>
          )}
        </Box>
          )*/}
      <Box textAlign="center" marginBottom={[2, 3, 4]}>
        <Text variant="h3">{advertType}</Text>
        <Text variant="h4">{advertSubject}</Text>
      </Box>
      <Box
        className={isLegacy ? s.bodyText : s.bodyText}
        dangerouslySetInnerHTML={{ __html: advertText }}
      ></Box>
    </Box>
  )
}
