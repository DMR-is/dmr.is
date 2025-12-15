import React from 'react'

import { useBoxStyles } from '../../island-is/index'
import { Tag } from '../../island-is/lib/Tag'

type Props = Omit<React.ComponentProps<typeof Tag>, 'onClick'> & {
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void
}

export const DMRTag = ({ onClick, ...props }: Props) => {
  const divRef = React.useRef<HTMLDivElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    // Focus the wrapper div instead of the inner Tag
    divRef.current?.focus()
    onClick?.(event)
  }

  const className = useBoxStyles({ display: 'inlineBlock', component: 'div' })

  return (
    <div ref={divRef} onClick={handleClick} tabIndex={0} className={className}>
      <Tag {...props} />
    </div>
  )
}
