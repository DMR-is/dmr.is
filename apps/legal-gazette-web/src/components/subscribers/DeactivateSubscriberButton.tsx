import { Button } from '@dmr.is/ui/components/island-is'

type Props = {
  onDeactivate?: () => void
  loading?: boolean
}

export const DeactivateSubscriberButton = ({ onDeactivate, loading }: Props) => {
  return (
    <Button
      circle
      title="Afvirkja áskrifanda"
      loading={loading}
      size="small"
      colorScheme="destructive"
      icon="removeCircle"
      iconType="outline"
      onClick={() => onDeactivate?.()}
    />
  )
}
