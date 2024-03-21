import {
  Tooltip as ReakitTooltip,
  TooltipReference,
  useTooltipState,
} from 'reakit'

import * as styles from './Tooltip.css'
import { Text } from '@island.is/island-ui/core'

type Props = {
  text: string
  children: React.ReactNode
}

export const Tooltip = ({ text, children }: Props) => {
  const tooltip = useTooltipState({ placement: 'bottom' })

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
