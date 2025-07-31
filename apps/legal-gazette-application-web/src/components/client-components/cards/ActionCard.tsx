'use client'

import {
  Box,
  Button,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

type Props = {
  title: string
  description?: string
  link?: {
    label: string
    href: string
  }
  children?: React.ReactNode
}

export const ActionCard = ({ title, description, link, children }: Props) => {
  return (
    <Box borderRadius="large" border="standard" padding={4} background="white">
      <Inline justifyContent="spaceBetween" alignY="center" flexWrap="wrap">
        <Stack space={2}>
          <Text variant="h3">{title}</Text>
          {description && <Text>{description}</Text>}
        </Stack>
        {link && (
          <LinkV2 href={link.href}>
            <Button icon="arrowForward">{link.label}</Button>
          </LinkV2>
        )}
        {children}
      </Inline>
    </Box>
  )
}
