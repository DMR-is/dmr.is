import { useEffect, useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Bullet } from '@dmr.is/ui/components/island-is/Bullet'
import { BulletList } from '@dmr.is/ui/components/island-is/BulletList'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useTRPC } from '../../lib/trpc/client/trpc'
import {
  AmendingMismatches,
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

const more = (count: number) => `og ${count} til viðbótar`

/** "5. gr. reglugerðar nr. 123/2020", or "reglugerð nr. 123/2020" */
const placeOf = (regulation: string, section?: string) =>
  section
    ? `${section} reglugerðar nr. ${regulation}`
    : `reglugerð nr. ${regulation}`

const describeValue = (v: ValueMismatch) =>
  v.type === 'missingFromText'
    ? `„${v.text}“ er í breytingu á ${placeOf(v.regulation, v.section)} en kemur ekki fram í textanum.`
    : v.section
      ? `„${v.text}“ í ${v.section} textans er hvergi í breytingum á stofnreglugerð.`
      : `„${v.text}“ í textanum er hvergi í breytingum á stofnreglugerð.`

/**
 * Warns the editor of an amending regulation about possible mismatches
 * between its text and the changes recorded on the base regulations: an
 * amount, a date or wording in one and not the other. The sender gets the
 * same warning in the OJOI application. Never blocks anything.
 */
export const AmendingMismatchesAlert = () => {
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

  const [mismatches, setMismatches] = useState<AmendingMismatches>()

  useEffect(() => {
    if (!enabled || !data) return

    let cancelled = false
    // Loaded on demand, like the differ: it parses HTML in the browser
    import('@dmr.is/regulations-tools/amendingMismatches-browser').then(
      ({ default: find }) => {
        if (cancelled) return
        setMismatches(
          getAmendingMismatches(find, {
            html: currentCase.html,
            additions: currentCase.additions,
            impacts: data.impacts ?? [],
          }),
        )
      },
    )
    return () => {
      cancelled = true
    }
  }, [enabled, data, currentCase.html, currentCase.additions])

  if (!enabled || !mismatches) {
    return null
  }
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
