import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'

type Props = {
  onClick?: () => void
  buttonText?: string
}

export const SubmitButton = ({ onClick, buttonText = 'Staðfesta' }: Props) => {
  return (
    <Inline align="right">
      <Button icon="arrowForward" onClick={onClick}>
        {buttonText}
      </Button>
    </Inline>
  )
}
