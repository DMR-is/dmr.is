import { Button } from '@dmr.is/ui/components/island-is/Button'

type Props = {
  onActivate?: () => void
  loading?: boolean
}

export const ActivateSubscriberButton = ({ onActivate, loading }: Props) => {
  return (
    <Button
      title="Virkja áskrifanda"
      circle
      variant="ghost"
      loading={loading}
      size="small"
      icon="checkmarkCircle"
      iconType="outline"
      onClick={() => onActivate?.()}
    />
  )
}
