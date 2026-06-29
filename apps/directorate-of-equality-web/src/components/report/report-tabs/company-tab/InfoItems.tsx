'use client'

import { isValidElement } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import * as styles from './InfoItems.css'

interface InfoItemProps {
  label: string
  children: React.ReactNode
}

const InfoItem = ({ label, children }: InfoItemProps) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Text fontWeight="medium">{label}</Text>
      {/* Element children (e.g. an inline editor) render as-is; primitives keep
          the Text wrapper and the unknown-value fallback. */}
      {isValidElement(children) ? (
        children
      ) : (
        <Text>{children ? children : 'Óþekkt'}</Text>
      )}
    </div>
  )
}

interface InfoItemsProps {
  description?: string
  items?: InfoItemProps[]
  colCount?: 2 | 3 | 4
}

export const InfoItems = ({
  description,
  items,
  colCount = 2,
}: InfoItemsProps) => {
  return (
    <>
      {description && <Text>{description}</Text>}
      <Box marginTop={2} className={styles.infoItemsGrid[colCount]}>
        {items?.map((item, index) => (
          <InfoItem key={index} label={item.label}>
            {item.children}
          </InfoItem>
        ))}
      </Box>
    </>
  )
}
