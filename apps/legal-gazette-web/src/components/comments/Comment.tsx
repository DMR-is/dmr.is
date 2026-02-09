import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export type CommentProps = {
  creator: string
  createdAt: string
  action: string
  icon?: React.ComponentProps<typeof Icon>['icon']
  receiver?: string
  message?: string
  iconType: 'filled' | 'outline'
  actionFirst?: boolean
}

export const Comment = ({
  creator,
  createdAt,
  action,
  icon = 'arrowForward',
  iconType,
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
      <Button
        as="div"
        circle
        variant="ghost"
        icon={icon}
        iconType={iconType}
        colorScheme="light"
      />
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
              {!!receiver && (
                <>
                  {' '}
                  <Text as="span" fontWeight="semiBold">
                    {receiver}
                  </Text>
                </>
              )}
            </Text>
          </Inline>
          {!!message && <Text>{message}</Text>}
        </Stack>
      </Box>
      <Text>{createdAt}</Text>
    </Box>
  )
}
