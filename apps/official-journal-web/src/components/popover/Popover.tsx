import { cloneElement } from 'react'
import {
  Popover as ReaPopover,
  PopoverDisclosure,
  PopoverState,
  usePopoverState,
} from 'reakit/Popover'

type Props = {
  disclosure: React.ReactElement
  children: React.ReactNode
  placement?: PopoverState['placement']
}

import * as styles from './Popover.css'

export const Popover = ({
  disclosure,
  children,
  placement = 'bottom-start',
}: Props) => {
  const popover = usePopoverState({ placement: 'auto-start' })
  return (
    <>
      <PopoverDisclosure {...popover} {...disclosure.props}>
        {(referenceProps) => cloneElement(disclosure, referenceProps)}
      </PopoverDisclosure>
      <ReaPopover className={styles.popover} {...popover}>
        {children}
      </ReaPopover>
    </>
  )
}
