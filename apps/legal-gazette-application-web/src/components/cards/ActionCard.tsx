'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

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
