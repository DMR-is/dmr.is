import React from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import * as s from './CaseCard.css'
import { messages } from './messages'
type Props = {
  insitiution?: string | null
  department?: string | null
  publicationNumber?: string | null
  year?: number | null
  publicationDate?: string | null
  title?: string | null
  categories?: string[] | null
  link?: string | null
  alert?: React.ReactNode
}

export const CaseCard = ({
  insitiution,
  department,
  publicationNumber,
  year,
  publicationDate,
  title,
  categories,
  link,
  alert,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <Stack space={2}>
      {alert && alert}

      <Box
        display="flex"
        flexDirection="column"
        rowGap={1}
        className={s.wrapper}
      >
        {(insitiution || department || publicationDate) && (
          <Box display="flex" justifyContent="spaceBetween">
            {insitiution && (
              <Box>
                <Text variant="eyebrow" color="blueberry400">
                  {insitiution}
                </Text>
              </Box>
            )}
            {(department || publicationDate) && (
              <Box>
                <Text variant="eyebrow" color="blueberry400">{`${department} ${
                  department && publicationDate ? ' - ' : ''
                } ${
                  publicationDate ? `Útg: ${formatDate(publicationDate)}` : ''
                }`}</Text>
              </Box>
            )}
          </Box>
        )}
        {publicationNumber && (
          <Box>
            <Text variant="h3">
              {publicationNumber}/{year}
            </Text>
          </Box>
        )}
        {title && (
          <Box>
            <Text>{title}</Text>
          </Box>
        )}
        <Box display="flex" justifyContent="spaceBetween" marginTop={2}>
          <Box display="flex" rowGap={1} columnGap={1}>
            {!!categories?.length &&
              categories.map((cat) => {
                return (
                  <Tag key={cat} variant="blue" outlined disabled>
                    {cat}
                  </Tag>
                )
              })}
          </Box>
          {link && (
            <LinkV2
              newTab
              href={link}
              color="blue400"
              underline="normal"
              underlineVisibility="always"
            >
              <Text as="span" fontWeight="medium" variant="small">
                {formatMessage(messages.general.moreLink)}
              </Text>
              <Icon icon="open" type="outline" size="small" />
            </LinkV2>
          )}
        </Box>
      </Box>
    </Stack>
  )
}
