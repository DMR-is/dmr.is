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
 * Company names collapsed, addresses on expand: nobody checks a thousand-
 * recipient send by reading a thousand addresses, but they do read company
 * names. The addresses still have to be reachable for "did this go to the right
 * address" when something goes wrong.
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
   * to several people. Their addresses stay visible collapsed, since the name
   * alone would print "Fyrirtæki ehf." three times with nothing to tell the rows
   * apart.
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
         * `role="list"` alongside the `ul`, not instead of it: Safari drops list
         * semantics from a `ul` with `list-style: none`, which the grid needs,
         * and a screen-reader user is here to check a count.
         */
        role="list"
        className={styles.list}
        background={tone === 'warning' ? 'red100' : 'dark100'}
        padding={2}
        borderRadius="large"
        marginTop={1}
      >
        {/*
          Keyed on the address as well as the company: a single-company send may
          name several addresses, and each is its own row.
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
