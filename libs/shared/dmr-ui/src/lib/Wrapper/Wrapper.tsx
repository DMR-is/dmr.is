import { ArrowLink, Box, Stack, Text } from '@island.is/island-ui/core'

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
        {title && (
          <Text variant="h3" as="h3">
            {title}
          </Text>
        )}
        {children}
        {link && <ArrowLink href={link}>{linkText}</ArrowLink>}
      </Stack>
    </Box>
  )
}
