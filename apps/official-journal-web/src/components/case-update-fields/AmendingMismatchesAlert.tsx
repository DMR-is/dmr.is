import { useMemo } from 'react'

import { getLogger } from '@dmr.is/logging-next'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { BulletList } from '@dmr.is/ui/components/island-is/BulletList'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import {
  AmendingMismatches,
  FindAmendingMismatches,
  getAmendingMismatches,
  ValueMismatch,
} from './amendingMismatches'

import { useQuery } from '@tanstack/react-query'

/** How many amounts and dates, wording groups, and texts per group to show */
const MAX_VALUES = 10
const MAX_GROUPS = 5
const MAX_TEXTS = 3
/** A long passage is cut, to keep the list readable */
const MAX_LENGTH = 120

const shorten = (text: string) =>
  text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH).trimEnd()}…` : text

const logger = getLogger('AmendingMismatchesAlert')

const more = (count: number) => `og ${count} til viðbótar`

/** "5. gr. reglugerðar nr. 123/2020", or "reglugerð nr. 123/2020" */
const placeOf = (regulation: string, section?: string) =>
  section
    ? `${section} reglugerðar nr. ${regulation}`
    : `reglugerð nr. ${regulation}`

/**
 * An article of the text, "1. gr." or "6. gr. a.", rather than an
 * appendix's title, which may cite one ("Viðauki við 3. gr. …")
 */
const isArticle = (section?: string) =>
  !!section && /^\d+\.\s*gr\.(\s|$)/.test(section)

const describeValue = (v: ValueMismatch) =>
  v.type === 'missingFromText'
    ? `„${v.text}“ er í breytingu á ${placeOf(v.regulation, v.section)} en kemur ekki fram í textanum.`
    : isArticle(v.section)
      ? `„${v.text}“ í ${v.section} textans er hvergi í breytingum á stofnreglugerð.`
      : `„${v.text}“ í textanum er hvergi í breytingum á stofnreglugerð.`

/** The checker, loaded once on demand, like the differ: it parses HTML in the browser */
const checkerQuery = {
  queryKey: ['amendingMismatchesChecker'],
  // Logged here, once, rather than by each alert
  queryFn: () =>
    import('@dmr.is/regulations-tools/amendingMismatches-browser').then(
      (m) => m.default,
      (error) => {
        logger.error('Failed to load the amending mismatch checker', {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      },
    ),
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
}

type Input = Parameters<typeof getAmendingMismatches>[1]

type Result = { mismatches: AmendingMismatches } | { error: unknown }

/**
 * The last check, shared by the two places the alert is shown: after a
 * save both get the same text and the same draft, so it runs, and a
 * failure is logged, once.
 */
let last: { key: string; draft: unknown; result: Result } | undefined

const check = (
  find: FindAmendingMismatches,
  draft: unknown,
  caseId: string,
  input: Input,
): Result => {
  const key = [
    caseId,
    input.html ?? '',
    ...(input.additions ?? []).map((a) =>
      [a.order, a.title, a.html].join('\u0000'),
    ),
  ].join('\u0001')
  if (last?.key !== key || last.draft !== draft) {
    let result: Result
    try {
      result = { mismatches: getAmendingMismatches(find, input) }
    } catch (error) {
      logger.error('Failed to check the amending text for mismatches', {
        caseId,
        error: error instanceof Error ? error.message : String(error),
      })
      result = { error }
    }
    last = { key, draft, result }
  }
  return last.result
}

/**
 * Warns the editor of an amending regulation about possible mismatches
 * between its text and the changes recorded on the base regulations: an
 * amount, a date or wording in one and not the other. The sender gets the
 * same warning in the OJOI application. Never blocks anything.
 */
export const AmendingMismatchesAlert = ({
  expanded,
}: {
  /** Whether the accordion it's in is open: it stays mounted when closed */
  expanded: boolean
}) => {
  const trpc = useTRPC()
  const { currentCase } = useCaseContext()

  const enabled =
    currentCase.applicationType === 'amending_regulation' &&
    !!currentCase.regulationDraftId

  // The same query as the impacts accordion, so it shares the cache
  const { data } = useQuery({
    ...trpc.getRegulationDraft.queryOptions({ caseId: currentCase.id }),
    enabled,
    refetchOnWindowFocus: false,
  })

  const checker = useQuery({ ...checkerQuery, enabled: enabled && expanded })
  const find = checker.data

  const result = useMemo(
    () =>
      expanded && data && find
        ? check(find, data, currentCase.id, {
            html: currentCase.html,
            additions: currentCase.additions,
            impacts: data.impacts ?? [],
          })
        : undefined,
    [
      expanded,
      data,
      find,
      currentCase.id,
      currentCase.html,
      currentCase.additions,
    ],
  )

  if (!enabled) {
    return null
  }
  // Shown, so a failed check isn't taken for one that found nothing
  if (checker.error || (result && 'error' in result)) {
    return (
      <AlertMessage
        type="warning"
        title="Ekki tókst að leita að ósamræmi"
        message="Texti breytingarreglugerðarinnar var ekki borinn saman við breytingarnar á stofnreglugerð. Prófaðu að endurhlaða síðuna."
      />
    )
  }
  if (!result) {
    return null
  }
  const { mismatches } = result
  const { values, wording } = mismatches
  if (!values.length && !wording.length) {
    return null
  }

  return (
    <AlertMessage
      type="warning"
      title="Mögulegt ósamræmi"
      message={
        <Stack space={2}>
          <Text variant="small">
            Texti breytingarreglugerðarinnar og breytingarnar á stofnreglugerð
            virðast ekki passa saman á eftirfarandi stöðum. Þetta eru
            ábendingar, ekki villur.
          </Text>
          {values.length > 0 && (
            <BulletList color="black">
              {values.slice(0, MAX_VALUES).map((v, i) => (
                <Bullet key={i}>{describeValue(v)}</Bullet>
              ))}
              {values.length > MAX_VALUES && (
                <Bullet>{more(values.length - MAX_VALUES)}</Bullet>
              )}
            </BulletList>
          )}
          {wording.length > 0 && (
            <>
              <Text variant="small" fontWeight="semiBold">
                Orðalag í breytingum á stofnreglugerð sem kemur ekki fram í
                textanum:
              </Text>
              <BulletList color="black">
                {wording.slice(0, MAX_GROUPS).map((group, i) => {
                  const place = placeOf(group.regulation, group.section)
                  const texts = group.texts
                    .slice(0, MAX_TEXTS)
                    .map((t) => `„${shorten(t)}“`)
                    .join(', ')
                  const rest = group.texts.length - MAX_TEXTS
                  return (
                    <Bullet key={i}>
                      {`${place.charAt(0).toUpperCase()}${place.slice(1)}: ${texts}${
                        rest > 0 ? ` ${more(rest)}` : ''
                      }`}
                    </Bullet>
                  )
                })}
                {wording.length > MAX_GROUPS && (
                  <Bullet>{more(wording.length - MAX_GROUPS)}</Bullet>
                )}
              </BulletList>
            </>
          )}
        </Stack>
      }
    />
  )
}
