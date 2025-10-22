import {
  Box,
  Button,
  Icon,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

export type CommentProps = {
  creator: string
  createdAt: string
  action: string
  icon?: React.ComponentProps<typeof Icon>['icon']
  receiver?: string
  message?: string
  actionFirst?: boolean
}

export const Comment = ({
  creator,
  createdAt,
  action,
  icon = 'arrowForward',
  receiver,
  message,
  actionFirst = false,
}: CommentProps) => {
  return (
    <Box
      display="flex"
      flexDirection="row"
      rowGap={2}
      columnGap={2}
      alignItems="center"
    >
      <Button as="div" circle variant="ghost" icon={icon} colorScheme="light" />
      <Box flexGrow={1}>
        <Stack space={1}>
          <Inline justifyContent="spaceBetween" alignY="center" space={2}>
            <Text>
              {actionFirst ? (
                <>
                  {action} <strong>{creator}</strong>
                </>
              ) : (
                <>
                  <strong>{creator}</strong> {action}
                </>
              )}
              {!!receiver && <Text>{receiver}</Text>}
            </Text>
          </Inline>
          {!!message && <Text>{message}</Text>}
        </Stack>
      </Box>
      <Text>{createdAt}</Text>
    </Box>
  )
}
