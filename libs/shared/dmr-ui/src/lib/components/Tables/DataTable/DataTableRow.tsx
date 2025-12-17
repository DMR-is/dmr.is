'use client'

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
  onExpandChange,
  ...row
}: DataTableRowProps<T>) => {
  const [expanded, setExpanded] = useState(startExpanded)
  const [hovered, setHovered] = useState<boolean>(false)
  const breakpoints = useBreakpoints()

  const colSpan = columns.length + (isExpandable ? 1 : 0)
  return (
    <>
      <tr
        onClick={(e) => {
          if (isExpandable) {
            setExpanded(!expanded)

            onExpandChange?.(!expanded)

            e.stopPropagation()
          }
        }}
        onMouseOver={() => hasLink && setHovered(true)}
        onMouseLeave={() => hasLink && setHovered(false)}
        role={isExpandable ? 'button' : 'div'}
        className={styles.dataTableRow({
          expandable: !!isExpandable || hasLink,
        })}
        style={{ background: row.background }}
      >
        {columns.map((column, i) => {
          const children = row[column.field as keyof typeof row]
          return <DataTableCell key={i}>{children}</DataTableCell>
        })}
        {hasLink && row.href && (
          <td align="center" className={styles.linkTableCell}>
            <LinkV2 href={row.href} shallow={false}>
              <Box
                className={styles.seeMoreTableCellLink({
                  visible: hovered,
                })}
              >
                <Box className={styles.seeMoreTableCellLinkText}>
                  <Text variant="eyebrow" color={'blue400'} as="span">
                    {breakpoints.xl && 'Opna mál'}
                    <Icon
                      icon="arrowForward"
                      color="blue400"
                      className={styles.seeMoreTableCellLinkIcon}
                    />
                  </Text>
                </Box>
              </Box>
            </LinkV2>
          </td>
        )}
        {isExpandable && (
          <DataTableCell>
            <button
              type="button"
              onClick={(e) => {
                setExpanded(!expanded)
                onExpandChange?.(!expanded)
                e.stopPropagation()
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
        <tr style={{ background: row.background }}>
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
