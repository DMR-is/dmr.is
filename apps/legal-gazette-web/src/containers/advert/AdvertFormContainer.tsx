'use client'

import { Box, Stack, Text } from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertBaseFields } from '../../components/field-set-items/AdvertBaseFields'
import { AdvertReadonlyFields } from '../../components/field-set-items/AdvertReadonlyFields'
import { ContentFields } from '../../components/field-set-items/ContentFields'
import { CourtAndJudgementFields } from '../../components/field-set-items/CourtAndJudgementFields'
import { DivisionMeetingFields } from '../../components/field-set-items/DivisionMeetingFields'
import { PublicationsFields } from '../../components/field-set-items/PublicationsFields'
import { SettlementFields } from '../../components/field-set-items/SettlementFields'
import { SignatureFields } from '../../components/field-set-items/SignatureFields'
import { AdvertFormAccordion } from '../../components/Form/AdvertFormAccordion'
import { AdvertDetailedDto } from '../../gen/fetch'
import {
  isBankruptcyRecallAdvert,
  isDeceasedRecallAdvert,
  isDivisionEndingAdvert,
  isDivisionMeetingAdvert,
} from '../../lib/advert-type-guards'
import { trpc } from '../../lib/trpc/client'

type AdvertContainerProps = {
  advert: AdvertDetailedDto
}

export function AdvertFormContainer({ advert }: AdvertContainerProps) {
  const [{ types }] = trpc.baseEntity.getAllEntities.useSuspenseQuery()
  const [{ courtDistricts }] = trpc.baseEntity.getAllEntities.useSuspenseQuery()
  const { data: categoriesForTypes } = trpc.baseEntity.getCategories.useQuery({
    type: advert.type.id,
  })

  const isBankruptcyRecall = isBankruptcyRecallAdvert(advert)
  const isRecallDeceased = isDeceasedRecallAdvert(advert)
  const isDivisionEnding = isDivisionEndingAdvert(advert)
  const isDivisionMeeting = isDivisionMeetingAdvert(advert)

  const shouldShowCourtAndJudgementFields =
    isBankruptcyRecall || isRecallDeceased || isDivisionEnding
  const shouldShowDivisionMeeting = isBankruptcyRecall || isDivisionMeeting

  const items = [
    {
      title: 'Upplýsingar um auglýsingu',
      children: (
        <AdvertReadonlyFields
          id={advert.id}
          publicationNumber={advert.publicationNumber}
          createdAt={formatDate(advert.createdAt, 'dd. MMMM yyyy')}
          createdBy={advert.createdBy}
        />
      ),
    },
    {
      title: 'Almennar upplýsingar',
      children: (
        <AdvertBaseFields
          id={advert.id}
          types={types}
          categories={categoriesForTypes?.categories ?? []}
          typeId={advert.type.id}
          categoryId={advert.category.id}
          title={advert.title ?? ''}
          additionalText={advert.additionalText ?? ''}
        />
      ),
      hidden: false,
    },
    {
      title: 'Efni auglýsingar',
      children: (
        <ContentFields
          id={advert.id}
          caption={advert.caption ?? ''}
          content={advert.content ?? ''}
        />
      ),
      // hidden: !!advert.caption && !!advert.content,
      hidden: false,
    },
    {
      title: 'Dómstóll og úrskurðardagur',
      children: (
        <CourtAndJudgementFields
          id={advert.id}
          courtDistrictId={advert.courtDistrict?.id}
          courtDistricts={courtDistricts}
          judgementDate={advert.judgementDate}
        />
      ),
      hidden: !shouldShowCourtAndJudgementFields,
    },
    {
      title: 'Upplýsingar um skiptafund',
      children: (
        <DivisionMeetingFields
          id={advert.id}
          divisionMeetingLocation={advert.divisionMeetingLocation ?? ''}
          divisionMeetingDate={
            advert.divisionMeetingDate ?? new Date().toISOString()
          }
        />
      ),
      hidden: !shouldShowDivisionMeeting,
    },
    {
      title: 'Upplýsingar um búið',
      children: (
        <SettlementFields
          id={advert.id}
          liquidatorName={advert.settlement?.liquidatorName ?? ''}
          liquidatorLocation={advert.settlement?.liquidatorLocation ?? ''}
          isBankruptcyRecall={isBankruptcyRecall}
          isDeceasedRecall={isRecallDeceased}
          isDivisionEnding={isDivisionEnding}
        />
      ),
      hidden: !advert.settlement,
    },
    {
      title: 'Undirritun',
      children: (
        <SignatureFields
          id={advert.id}
          signatureName={advert.signatureName ?? ''}
          signatureOnBehalfOf={advert.signatureOnBehalfOf ?? ''}
          signatureLocation={advert.signatureLocation ?? ''}
          signatureDate={advert.signatureDate ?? new Date().toISOString()}
        />
      ),
    },
    {
      title: 'Birtingar',
      children: (
        <PublicationsFields
          id={advert.id}
          publications={advert.publications}
          advertStatus={advert.status.title}
        />
      ),
    },
  ].filter((item) => !item.hidden)
  return (
    <Box background="white" padding={[4, 6, 8]} borderRadius="large">
      <Stack space={[3, 4]}>
        <Stack space={[1, 2]}>
          <Text variant="h2">Vinnslusvæði Lögbirtingablaðsins</Text>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            at interdum risus. Orci varius natoque penatibus et magnis dis
            parturient montes, nascetur ridiculus mus. Phasellus finibus lacinia
            luctus. Donec in nisi et justo luctus egestas.
          </Text>
        </Stack>
        <AdvertFormAccordion items={items} />
      </Stack>
    </Box>
  )
}
