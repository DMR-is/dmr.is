'use client'

import { Button } from '../../../island-is/lib/Button'
import { Icon } from '../../../island-is/lib/Icon'
import { Inline } from '../../../island-is/lib/Inline'
import { Tag } from '../../../island-is/lib/Tag'
import { Text } from '../../../island-is/lib/Text'

type TextItem = {
  type: 'text'
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Text>['variant']
  fontWeight?: React.ComponentProps<typeof Text>['fontWeight']
  color?: React.ComponentProps<typeof Text>['color']
}

type TagItem = {
  type: 'tag'
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Tag>['variant']
  /** Regular-weight label; see `Tag`'s own note on why a table wants this. */
  light?: React.ComponentProps<typeof Tag>['light']
}

type IconItem = {
  type: 'icon'
  icon: React.ComponentProps<typeof Icon>['icon']
  color?: React.ComponentProps<typeof Icon>['color']
  size?: React.ComponentProps<typeof Icon>['size']
}

type ButtonItem = {
  type: 'button'
  label: string
  onClick: (e: React.MouseEvent) => void
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  icon?: React.ComponentProps<typeof Button>['icon']
}

export type TableCellItem = TextItem | TagItem | IconItem | ButtonItem

const renderItem = (item: TableCellItem, i: number) => {
  switch (item.type) {
    case 'text':
      return (
        <Text
          key={i}
          variant={item.variant ?? 'default'}
          fontWeight={item.fontWeight}
          color={item.color}
        >
          {item.children}
        </Text>
      )
    case 'tag':
      // ⚠️ `wrap` is not optional here. The table defaults to
      // `tableLayout: fixed`, so a cell's width is decided by the column, not
      // by its content — and a `Tag` left on its base `nowrap` clamps its BOX
      // to the column while its label keeps going, rendering the end of the
      // text across its own border. Wrapping costs a taller row only for the
      // labels that would otherwise overflow; every label that already fits is
      // untouched.
      return (
        <Tag
          key={i}
          variant={item.variant}
          outlined
          disabled
          light={item.light}
          wrap
        >
          {item.children}
        </Tag>
      )
    case 'icon':
      return (
        <Icon key={i} icon={item.icon} color={item.color} size={item.size} />
      )
    case 'button':
      return (
        <Button
          key={i}
          variant={item.variant ?? 'text'}
          size={item.size ?? 'small'}
          icon={item.icon}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      )
  }
}

type Props = {
  items: TableCellItem | TableCellItem[]
}

export const TableCell = ({ items }: Props) => {
  const list = Array.isArray(items) ? items : [items]

  if (list.length === 1) return <>{renderItem(list[0], 0)}</>

  return (
    <Inline space={1} alignY="center">
      {list.map((item, i) => renderItem(item, i))}
    </Inline>
  )
}
