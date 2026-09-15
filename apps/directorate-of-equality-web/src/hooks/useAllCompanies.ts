'use client'
import { useMemo } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import type { CompanyDto } from '../gen/fetch/types.gen'
import { useTRPCClient } from '../lib/trpc/client/trpc'
import { formatNationalId } from '../lib/utils'

/**
 * Rows per request while sweeping the register.
 *
 * NOT a ceiling: the sweep runs until `paging.totalPages` is exhausted, so this
 * only trades request count against payload size. It must stay that way — a
 * fixed cap here is exactly the bug this hook exists to remove. The register
 * outgrew a hardcoded `pageSize: 1000` and the selector silently stopped
 * listing companies from "L" onwards, with no error anywhere.
 */
const PAGE_SIZE = 500

/**
 * ⚠️ Inclusion flags are required here. The register hides companies with
 * no reporting obligation and companies off the register BY DEFAULT, which
 * is right for a working list of who owes what — but this is a selector,
 * not the register. An admin filing on a company's behalf must still be
 * able to pick one that owes nothing (voluntary certification) or one that
 * has been deregistered. Backend submission eligibility is unchanged and
 * still has the final say.
 */
const SELECTOR_QUERY = {
  includeNotObliged: true,
  includeInactive: true,
} as const

/**
 * The whole company register, for the "file on a company's behalf" selectors.
 *
 * Distinct from `useCompanies`, which backs the register page and paginates on
 * purpose. These selectors have no paging UI, so anything not fetched is simply
 * unreachable — including by typing, since the field filters client-side.
 */
export function useAllCompanies() {
  const client = useTRPCClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['company', 'all', SELECTOR_QUERY],
    // The register moves on import runs, not within a session.
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Array<CompanyDto>> => {
      const first = await client.company.list.query({
        ...SELECTOR_QUERY,
        page: 1,
        pageSize: PAGE_SIZE,
      })

      // Pages 2..n in parallel. Page 1 has to land first because only the
      // response knows how many pages there are.
      const rest = await Promise.all(
        Array.from(
          { length: Math.max(first.paging.totalPages - 1, 0) },
          (_, i) =>
            client.company.list.query({
              ...SELECTOR_QUERY,
              page: i + 2,
              pageSize: PAGE_SIZE,
            }),
        ),
      )

      return [first, ...rest].flatMap((response) => response.companies)
    },
  })

  const companies = useMemo(() => data ?? [], [data])

  const options = useMemo(
    () =>
      companies.map((company) => ({
        label: `${company.name} (${formatNationalId(company.nationalId)})`,
        value: company.id,
      })),
    [companies],
  )

  return { companies, options, isLoading, isError }
}
