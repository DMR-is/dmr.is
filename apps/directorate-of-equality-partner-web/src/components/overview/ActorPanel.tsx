import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { formatNationalId } from '../../lib/format'
import { actorText as t } from '../../lib/text'
import { InfoItems } from '../InfoItems'

type Actor = { name: string; nationalId: string }

type Props = {
  actor: Actor | null
  companyName: string | null
  companyNationalId: string | null
}

/**
 * Who is acting. Under a procuration login that is a person distinct from the
 * company, and everything they grant or mint here is recorded against their
 * own kennitala — which is worth saying before they do it, not after.
 *
 * A company can also sign in as itself, with no actor. That is a legitimate
 * login, not a missing field, so it gets its own explanation rather than an
 * empty section.
 */
export const ActorPanel = ({
  actor,
  companyName,
  companyNationalId,
}: Props) => {
  const actingFor = [
    companyName,
    companyNationalId ? formatNationalId(companyNationalId) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Stack space={3}>
      <Text variant="h3" as="h2">
        {t.heading}
      </Text>

      {actor ? (
        <>
          <InfoItems
            items={[
              { label: t.name, children: actor.name },
              {
                label: t.nationalId,
                children: formatNationalId(actor.nationalId),
              },
              { label: t.actingFor, children: actingFor },
            ]}
          />
          <Text variant="small" color="dark400">
            {t.auditNote}
          </Text>
        </>
      ) : (
        <AlertMessage type="info" title={t.selfTitle} message={t.selfMessage} />
      )}
    </Stack>
  )
}
