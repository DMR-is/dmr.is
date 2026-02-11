'use client'

import { Box } from '../../island-is/lib/Box'
import { Text } from '../../island-is/lib/Text'
import * as styles from './AdvertDisplay.css'

export type AdvertDisplayProps = {
  number?: string
  date?: string
  type?: string
  title?: string
  html?: string
  withStyles?: boolean
}
export const AdvertDisplay = ({
  number,
  date,
  type,
  title,
  html,
  withStyles = true,
}: AdvertDisplayProps) => {
  const hasNumberOrDate = number || date
  return (
    <Box position="relative" overflow="auto">
      <Box
        border="standard"
        borderColor="purple200"
        borderRadius="large"
        padding={[2, 3, 4]}
        background="white"
      >
        {hasNumberOrDate && (
          <Box display="flex" justifyContent="spaceBetween">
            <Text variant="eyebrow" color="purple400">
              {number}
            </Text>
            <Text variant="eyebrow" color="purple400">
              {date}
            </Text>
          </Box>
        )}
        {(type || title) && (
          <Box textAlign="center" marginBottom={[2, 3, 4]}>
            {type && <Text variant="h3">{type}</Text>}
            {title && <Text variant="h4">{title}</Text>}
          </Box>
        )}
        {html && (
          <Box
            className={withStyles ? styles.bodyText : styles.legacyText}
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        )}
      </Box>
    </Box>
  )
}
