'use client'
import { useMemo } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { useTRPC } from '../lib/trpc/client/trpc'
import { formatNationalId } from '../lib/utils'

/**
 * Size of the probe request.
 *
 * NOT a ceiling on the selector: anything larger is re-fetched at the server's
 * own reported size. It must stay that way — a fixed cap is exactly the bug
 * this hook exists to remove. The register outgrew a hardcoded
 * `pageSize: 1000` and the selector silently stopped listing companies from
 * "L" onwards, with no error anywhere.
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

/** The register moves on import runs, not within a session. */
const STALE_TIME = 5 * 60_000

/**
 * The whole company register, for the "file on a company's behalf" selectors.
 *
 * Distinct from `useCompanies`, which backs the register page and paginates on
 * purpose. These selectors have no paging UI, so anything not fetched is simply
 * unreachable — including by typing, since the field filters client-side.
 */
export function useAllCompanies() {
  const trpc = useTRPC()

  // One ordinary page, read only for `paging.totalItems` — the server's own
  // count of the filtered register. Asking it beats guessing a ceiling.
  const probe = useQuery(
    trpc.company.list.queryOptions(
      { ...SELECTOR_QUERY, page: 1, pageSize: PAGE_SIZE },
      { staleTime: STALE_TIME },
    ),
  )

  const totalItems = probe.data?.paging.totalItems ?? 0
  const needsFullFetch = totalItems > PAGE_SIZE

  // Re-ask for the register sized to what the server just said it holds. If it
  // grew between the two requests the newest few rows are missed until the next
  // refetch — acceptable for a register that changes on import runs.
  const full = useQuery(
    trpc.company.list.queryOptions(
      // `|| PAGE_SIZE` keeps the input valid while the probe is still in
      // flight: the router's schema requires `pageSize >= 1`, and a disabled
      // query should still describe a request that would succeed.
      { ...SELECTOR_QUERY, page: 1, pageSize: totalItems || PAGE_SIZE },
      { enabled: needsFullFetch, staleTime: STALE_TIME },
    ),
  )

  // Never fall back to the probe's page while the full fetch is in flight —
  // that would put a truncated list in front of the admin, which is the bug.
  const companies = useMemo(
    () => (needsFullFetch ? full.data?.companies : probe.data?.companies) ?? [],
    [needsFullFetch, full.data, probe.data],
  )

  const isLoading = probe.isLoading || (needsFullFetch && full.isLoading)
  const isError = probe.isError || full.isError

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
