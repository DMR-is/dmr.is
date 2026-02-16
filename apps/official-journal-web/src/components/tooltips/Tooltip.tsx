import { Text } from '@dmr.is/ui/components/island-is/Text'

import * as styles from './Tooltip.css'

type Props = {
  text: string
  children: React.ReactNode
}

export const Tooltip = ({ text, children }: Props) => {
  if (!text) return null

  return (
    <span className={styles.container} tabIndex={0}>
      {children}
      <div className={styles.tooltipStyle} role="tooltip">
        <Text color="white" variant="small">
          {text}
        </Text>
      </div>
    </span>
  )
}
