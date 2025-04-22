import { useState } from 'react'
import AnimateHeight from 'react-animate-height'

import { Box, Icon, LinkV2, Text } from '@island.is/island-ui/core'

import useBreakpoints from '../../../hooks/useBreakpoints'
import * as styles from './DataTable.css'
import { DataTableCell } from './DataTableCell'
import { DataTableColumnProps, DataTableRowProps } from './types'

export const DataTableRow = <T extends readonly DataTableColumnProps[]>({
  columns,
  isExpandable,
  hasLink = false,
  startExpanded = false,
  ...row
}: DataTableRowProps<T>) => {
  const [expanded, setExpanded] = useState(startExpanded)
  const [hovered, setHovered] = useState<boolean>(false)
  const breakpoints = useBreakpoints()

  const colSpan = columns.length + (isExpandable ? 1 : 0)
  return (
    <>
      <tr
        onMouseOver={() => hasLink && setHovered(true)}
        onMouseLeave={() => hasLink && setHovered(false)}
        role={isExpandable ? 'button' : 'div'}
        className={styles.dataTableRow({ expandable: !!isExpandable || hasLink })}
        onClick={() => isExpandable && setExpanded(!expanded)}
      >
        {columns.map((column) => {
          const children = row[column.field as keyof typeof row]
          return <DataTableCell key={column.field}>{children}</DataTableCell>
        })}
        {hasLink && row.href && (
          <td align="center" className={styles.linkTableCell}>
            <Box
              className={styles.seeMoreTableCellLink({
                visible: hovered,
              })}
              component={LinkV2}
              href={row.href}
            >
              <Box className={styles.seeMoreTableCellLinkText}>
                <Text variant="eyebrow" color={'blue400'}>
                  {breakpoints.xl && 'Sjá nánar'}
                  <Icon
                    icon="arrowForward"
                    color="blue400"
                    className={styles.seeMoreTableCellLinkIcon}
                  />
                </Text>
              </Box>
            </Box>
          </td>
        )}
        {isExpandable && (
          <DataTableCell>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              <Icon
                color="blue400"
                icon={expanded ? 'chevronUp' : 'chevronDown'}
              />
            </button>
          </DataTableCell>
        )}
      </tr>
      {isExpandable && (
        <tr>
          <td colSpan={colSpan}>
            <AnimateHeight duration={300} height={expanded ? 'auto' : 0}>
              {row.children}
            </AnimateHeight>
          </td>
        </tr>
      )}
    </>
  )
}
