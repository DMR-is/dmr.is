import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'

type Props = {
  onClick?: () => void
  buttonText?: string
  isLoading?: boolean
}

export const SubmitButton = ({ onClick, buttonText = 'Staðfesta', isLoading = false }: Props) => {
  return (
    <Inline align="right">
      <Button icon="arrowForward" onClick={onClick} loading={isLoading}>
        {buttonText}
      </Button>
    </Inline>
  )
}
