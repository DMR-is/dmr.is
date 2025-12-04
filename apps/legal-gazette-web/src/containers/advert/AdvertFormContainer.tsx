'use client'

import { useQuery, useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  Box,
  Breadcrumbs,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertBaseFields } from '../../components/field-set-items/AdvertBaseFields'
import { AdvertReadonlyFields } from '../../components/field-set-items/AdvertReadonlyFields'
import { CommentFields } from '../../components/field-set-items/CommentFields'
import { CommunicationChannelFields } from '../../components/field-set-items/CommunicationChannelFields'
import { ContentFields } from '../../components/field-set-items/ContentFields'
import { CourtAndJudgementFields } from '../../components/field-set-items/CourtAndJudgementFields'
import { DivisionMeetingFields } from '../../components/field-set-items/DivisionMeetingFields'
import { PublicationsFields } from '../../components/field-set-items/PublicationsFields'
import { SettlementFields } from '../../components/field-set-items/SettlementFields'
import { SignatureFields } from '../../components/field-set-items/SignatureFields'
import { AdvertFormAccordion } from '../../components/Form/AdvertFormAccordion'
import { StatusIdEnum } from '../../gen/fetch'
import {
  DivisionMeetingAdvertTypes,
  RecallAdvertTypes,
  Route,
} from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

type AdvertContainerProps = {
  id: string
}

export function AdvertFormContainer({ id }: AdvertContainerProps) {
  const trpc = useTRPC()
  const { data: entities } = useSuspenseQuery(
    trpc.getAllEntities.queryOptions(),
  )

  const { data: advert } = useSuspenseQuery(trpc.getAdvert.queryOptions({ id }))

  const { data: categoriesForTypes } = useQuery(
    trpc.getCategories.queryOptions(
      {
        type: advert?.type.id as string,
      },
      { enabled: !!advert?.type.id },
    ),
  )

  const isRecallAdvertType = RecallAdvertTypes.includes(advert.templateType)
  const hasDivisionMeeting = DivisionMeetingAdvertTypes.includes(
    advert.templateType,
  )

  const items = advert
    ? [
        {
          title: 'Upplýsingar um auglýsingu',
          children: (
            <AdvertReadonlyFields
              id={advert.id}
              publicationNumber={advert.publicationNumber}
              createdAt={formatDate(advert.createdAt, 'dd. MMMM yyyy')}
              createdBy={advert.createdBy}
              paid={!!advert.paidAt}
              totalPrice={advert.totalPrice}
            />
          ),
          hidden: false,
        },
        {
          title: 'Almennar upplýsingar',
          children: (
            <AdvertBaseFields
              id={advert.id}
              canEdit={advert.canEdit}
              types={entities?.types ?? []}
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
              canEdit={advert.canEdit}
              caption={advert.caption ?? ''}
              content={advert.content ?? ''}
            />
          ),
          hidden: false,
        },
        {
          title: 'Dómstóll og úrskurðardagur',
          children: (
            <CourtAndJudgementFields
              id={advert.id}
              canEdit={advert.canEdit}
              courtDistrictId={advert.courtDistrict?.id}
              courtDistricts={entities?.courtDistricts ?? []}
              judgementDate={advert.judgementDate}
            />
          ),
          hidden: !isRecallAdvertType,
        },
        {
          title: 'Upplýsingar um skiptafund',
          children: (
            <DivisionMeetingFields
              id={advert.id}
              canEdit={advert.canEdit}
              divisionMeetingLocation={advert.divisionMeetingLocation ?? ''}
              divisionMeetingDate={
                advert.divisionMeetingDate ?? new Date().toISOString()
              }
            />
          ),
          hidden: !hasDivisionMeeting,
        },
        {
          title: 'Upplýsingar um búið',
          children: advert.settlement ? (
            <SettlementFields
              advertId={advert.id}
              canEdit={advert.canEdit}
              settlement={advert.settlement}
              templateType={advert.templateType}
            />
          ) : null,
          hidden: !isRecallAdvertType,
        },
        {
          title: 'Undirritun',
          children: (
            <SignatureFields
              id={advert.id}
              canEdit={advert.canEdit}
              signatureName={advert.signatureName ?? ''}
              signatureOnBehalfOf={advert.signatureOnBehalfOf ?? ''}
              signatureLocation={advert.signatureLocation ?? ''}
              signatureDate={
                advert.signatureDate
                  ? new Date(advert.signatureDate)
                  : undefined
              }
            />
          ),
          hidden: false,
        },
        {
          title: 'Birtingar',
          children: (
            <PublicationsFields
              id={advert.id}
              canEdit={advert.canEdit}
              publications={advert.publications}
              advertStatus={advert.status.title}
            />
          ),
          hidden: false,
        },
        {
          title: 'Samskiptaleiðir',
          children: (
            <CommunicationChannelFields
              advertId={advert.id}
              channels={advert.communicationChannels}
            />
          ),
          hidden: false,
        },
        {
          title: 'Athugasemdir',
          children: <CommentFields id={advert.id} />,
          hidden: false,
        },
      ].filter((item) => !item.hidden)
    : []

  return (
    <Box background="white" padding={[4, 6, 8]} borderRadius="large">
      <Stack space={[3, 4]}>
        <Breadcrumbs
          items={[
            {
              title: 'Stjórnborð',
              href: Route.STJORNBORD,
            },
            {
              title: 'Ritstjórn',
              href: Route.RITSTJORN,
            },
            {
              title: advert.title,
            },
          ]}
        />
        <Stack space={[1, 2]}>
          <Text variant="h2">Vinnslusvæði Lögbirtingablaðsins</Text>
          <Text>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            at interdum risus. Orci varius natoque penatibus et magnis dis
            parturient montes, nascetur ridiculus mus. Phasellus finibus lacinia
            luctus. Donec in nisi et justo luctus egestas.
          </Text>
        </Stack>
        {advert.canEdit === false && (
          <AlertMessage
            type={advert.status.id === StatusIdEnum.REJECTED ? 'error' : 'info'}
            title={
              advert.status.id === StatusIdEnum.REJECTED
                ? 'Auglýsingin var hafnað'
                : 'Þú ert ekki skráður sem starfsmaður á þessari auglýsingu'
            }
            message={
              advert.status.id === StatusIdEnum.REJECTED
                ? 'Ekki er hægt að eiga við hafnaðar auglýsingar.'
                : 'Aðeins starfsfólk sem er skráð á auglýsinguna getur unnið í henni.'
            }
          />
        )}
        <AdvertFormAccordion items={items} />
      </Stack>
    </Box>
  )
}
