import { Box } from "@island.is/island-ui/core/Box/Box"
import { ArrowLink } from "@island.is/island-ui/core/Link/ArrowLink/ArrowLink"
import { Stack } from "@island.is/island-ui/core/Stack/Stack"
import { Text } from "@island.is/island-ui/core/Text/Text"


type WrapperProps = {
  background?: 'white' | 'blue'
  children?: React.ReactNode
  title?: string
  link?: string
  linkText?: string
}

export const Wrapper = ({ children, title, link, linkText }: WrapperProps) => {
  return (
    <Box
      background="white"
      border="standard"
      borderColor="blue200"
      borderRadius="large"
      padding={4}
    >
      <Stack space={3}>
        <Stack space={2}>
          {title && (
            <Text variant="h3" as="h3">
              {title}
            </Text>
          )}
          {children}
        </Stack>
        {link && <ArrowLink href={link}>{linkText}</ArrowLink>}
      </Stack>
    </Box>
  )
}
