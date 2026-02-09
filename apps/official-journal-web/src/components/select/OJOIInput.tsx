import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
// TODO: Change import
import { BoxProps } from '@island.is/island-ui/core'

type Props = React.ComponentProps<typeof Input> & {
  width?: BoxProps['width']
  copyOptions?: {
    toCopy: string
    label: string
  }
  isValidating?: boolean
}

export const OJOIInput = ({
  loading,
  isValidating,
  width,
  copyOptions,
  ...rest
}: Props) => {
  return loading ? (
    <SkeletonLoader height={64} borderRadius="standard" />
  ) : (
    <Box width={width}>
      <Input
        size="sm"
        backgroundColor="blue"
        {...rest}
        buttons={
          copyOptions
            ? [
                {
                  name: 'copy',
                  label: 'Afrita',
                  type: 'outline',
                  onClick: () => {
                    navigator.clipboard.writeText(`${copyOptions.toCopy}`)
                    toast.info(copyOptions.label, {
                      toastId: 'copyId',
                    })
                  },
                },
              ]
            : undefined
        }
        loading={isValidating}
      />
    </Box>
  )
}
