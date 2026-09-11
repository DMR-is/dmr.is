'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { companiesText } from '../../lib/text'
import * as styles from './CompanyEmailRecipientList.css'

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

  /*
   * Companies appearing on more than one row — a single-company send addressed
   * to several people. Their addresses stay visible collapsed, because the name
   * alone would print "Fyrirtæki ehf." three times with nothing to tell the
   * rows apart, and the reason there are three is precisely the addresses.
   */
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const { companyId } of rows) {
    if (seen.has(companyId)) repeated.add(companyId)
    else seen.add(companyId)
  }

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
        component="ul"
        /*
         * ⚠️ `role="list"` alongside the `ul`, not instead of it. Safari drops
         * list semantics from a `ul` whose `list-style` is `none` — which the
         * grid needs — and the role is what puts "list, 42 items" back for a
         * screen-reader user, who is here to check a count.
         */
        role="list"
        className={styles.list}
        background={tone === 'warning' ? 'red100' : 'dark100'}
        padding={2}
        borderRadius="large"
        marginTop={1}
      >
        {/*
          ⚠️ Keyed on the address as well as the company. One company can appear
          more than once: a single-company send may name several addresses, and
          each is its own message and its own row.
        */}
        {rows.map((row) => (
          <Box
            key={`${row.companyId}:${row.email ?? ''}`}
            component="li"
            className={styles.item}
          >
            <Text variant="small" fontWeight="semiBold">
              {row.companyName}
            </Text>
            {(isOpen || repeated.has(row.companyId)) && (
              <Text variant="small" color="dark400">
                {row.email ?? t.noEmailPlaceholder}
                {row.note ? ` · ${row.note}` : ''}
              </Text>
            )}
            {/* The reason stays visible collapsed — it is why the row is here. */}
            {!isOpen && !repeated.has(row.companyId) && row.note && (
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
