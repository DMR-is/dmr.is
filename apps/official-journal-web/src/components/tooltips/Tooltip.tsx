import {
  Tooltip as ReakitTooltip,
  TooltipReference,
  useTooltipState,
} from 'reakit'

import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useIsMounted } from '../../hooks/useIsMounted'
import * as styles from './Tooltip.css'

type Props = {
  text: string
  children: React.ReactNode
}

export const Tooltip = ({ text, children }: Props) => {
  const isMounted = useIsMounted()

  const tooltip = useTooltipState({ placement: 'bottom' })

  if (!isMounted) return null
  if (!text) return null

  return (
    <>
      <TooltipReference {...tooltip}>{children}</TooltipReference>
      <ReakitTooltip {...tooltip}>
        <div className={styles.tooltipStyle}>
          <Text color="white" variant="small">
            {text}
          </Text>
        </div>
      </ReakitTooltip>
    </>
  )
}
