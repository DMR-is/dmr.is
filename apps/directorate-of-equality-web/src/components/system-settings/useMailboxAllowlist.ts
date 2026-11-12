'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'

import { MAILBOX_ALLOWLIST_CONFIG_KEY } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { parseMailboxAllowlist } from './mailboxAllowlist'

/**
 * The allowlist row, its history and the environment's mailbox switch, for
 * both the section and the sidebar's Breyta action. React Query dedupes the
 * reads, so calling it in both places fetches each once.
 *
 * A missing row (404) reads as nobody, as it does in the API, and counts as
 * loaded; any other failure leaves `loaded` false, so nothing shows "nobody"
 * for a value it never read and the edit stays closed.
 */
export const useMailboxAllowlist = () => {
  const trpc = useTRPC()

  const {
    data: current,
    isPending,
    error,
  } = useQuery(
    trpc.config.getByKey.queryOptions({ key: MAILBOX_ALLOWLIST_CONFIG_KEY }),
  )
  const { data: history } = useQuery(
    trpc.config.getHistoryByKey.queryOptions({
      key: MAILBOX_ALLOWLIST_CONFIG_KEY,
    }),
  )
  const { data: status, isError: statusFailed } = useQuery(
    trpc.config.getOneSystemsStatus.queryOptions(),
  )

  const missing = error?.data?.httpStatus === 404
  const value = current?.value ?? 'none'

  return {
    value,
    parsed: parseMailboxAllowlist(value),
    isPending,
    loaded: !!current || missing,
    /**
     * No active row. Reads as nobody, but cannot be saved: the API updates
     * the active row and has none to update.
     */
    missing,
    history: history ?? [],
    status,
    /** The environment's switch could not be read. */
    statusFailed,
  }
}
