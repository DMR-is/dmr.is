'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { companiesText } from '../../lib/text'

const t = companiesText.sendEmail

export type RecipientRow = {
  companyId: string
  companyName: string
  email: string | null
  /** Only the skipped list sets this — a short reason shown beside the name. */
  note?: string
}

type Props = {
  heading: string
  rows: RecipientRow[]
  /** `red600` for the skipped list, so the two are distinguishable at a glance. */
  tone?: 'default' | 'warning'
}

/**
 * A collapsed count that opens into the addresses behind it.
 *
 * ⚠️ Company names collapsed, addresses on expand — that split is the design,
 * not a space saving. Checking a thousand-recipient send by reading a thousand
 * email addresses is not a thing anyone will do; checking it by reading company
 * names is. The addresses still have to be *reachable*, because "did this go to
 * the right address for this company" is the question that comes up when
 * something goes wrong.
 */
export const CompanyEmailRecipientList = ({
  heading,
  rows,
  tone = 'default',
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!rows.length) return null

  return (
    <Box>
      <Box display="flex" alignItems="center" columnGap={1}>
        <Text variant="eyebrow" color={tone === 'warning' ? 'red600' : 'dark400'}>
          {heading} ({rows.length})
        </Text>
        <Button
          variant="text"
          size="small"
          icon={isOpen ? 'chevronUp' : 'chevronDown'}
          iconType="outline"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
        >
          {isOpen ? t.hideRecipients : t.showRecipients}
        </Button>
      </Box>

      <Box
        background={tone === 'warning' ? 'red100' : 'dark100'}
        padding={2}
        borderRadius="large"
        marginTop={1}
        // Capped rather than unbounded: a filter can match the whole register,
        // and a 1 700-row list would push the send button off the modal.
        style={{ maxHeight: 240, overflowY: 'auto' }}
      >
        {rows.map((row) => (
          <Box key={row.companyId} paddingY="smallGutter">
            <Text variant="small" fontWeight="semiBold">
              {row.companyName}
            </Text>
            {isOpen && (
              <Text variant="small" color="dark400">
                {row.email ?? t.noEmailPlaceholder}
                {row.note ? ` · ${row.note}` : ''}
              </Text>
            )}
            {/* The reason stays visible collapsed — it is why the row is here. */}
            {!isOpen && row.note && (
              <Text variant="small" color="dark400">
                {row.note}
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
