import { ArrowLink } from '@island.is/island-ui/core/Link/ArrowLink/ArrowLink'
import { Stack } from '@island.is/island-ui/core/Stack/Stack'
import { Text } from '@island.is/island-ui/core/Text/Text'

export type CallToActionProps = {
  title?: string
  description?: string
  link?: string
  linkText?: string
}

export const CallToAction = ({
  title,
  description,
  link,
  linkText,
}: CallToActionProps) => {
  return (
    <Stack space={4}>
      <Stack space={2}>
        {title && (
          <Text variant="h1" as="h2">
            {title}
          </Text>
        )}
        {description && <Text>{description}</Text>}
      </Stack>
      {link && linkText && <ArrowLink href={link}>{linkText}</ArrowLink>}
    </Stack>
  )
}
