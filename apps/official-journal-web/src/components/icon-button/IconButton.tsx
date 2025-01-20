import { ComponentProps } from 'react'

import { BoxProps, Icon, useBoxStyles } from '@island.is/island-ui/core'

type IconProps = ComponentProps<typeof Icon>

type Props = Pick<IconProps, 'icon' | 'size' | 'color' | 'type'> & {
  background?: BoxProps['background']
  onClick?: () => void
}

export const IconButton = (props: Props) => {
  const buttonClass = useBoxStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'circle',
    background: props?.background || 'blue100',
    padding: 1,
    component: 'button',
  })

  const withDefault = {
    ...props,
    size: props.size || 'medium',
    color: props.color || 'blue400',
  }

  return (
    <button className={buttonClass} type="button" onClick={props.onClick}>
      <Icon {...withDefault} />
    </button>
  )
}
