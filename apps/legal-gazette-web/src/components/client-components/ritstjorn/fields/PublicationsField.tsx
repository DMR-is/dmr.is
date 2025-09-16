'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { DropdownMenu, Inline, toast } from '@island.is/island-ui/core'

import {
  AdvertPublicationDetailedDto,
  ApiErrorDto,
  GetAdvertPublicationRequest,
  GetAdvertPublicationVersionEnum,
  UpdateAdvertPublicationRequest,
} from '../../../../gen/fetch'
import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useClient } from '../../../../hooks/useClient'
import { AdvertModal } from '../../modals/AdvertPublicationModal'

export const PublicationsFields = () => {
  const { advert } = useAdvertContext()

  const publicationClient = useClient('AdvertPublicationsApi')
  const updateClient = useClient('AdvertUpdateApi')
  const [html, setHTML] = useState<string>('')
  const [toggle, setToggle] = useState(false)

  const [publicationRequest, setPublicationRequest] =
    useState<GetAdvertPublicationRequest | null>(null)

  useSWR<AdvertPublicationDetailedDto, ApiErrorDto>(
    publicationRequest ? publicationRequest : null,
    (arg: GetAdvertPublicationRequest) => {
      return publicationClient.getAdvertPublication(arg)
    },
    {
      onSuccess: (data) => {
        setHTML(data.html)
        setToggle(true)
      },
      onError: (_error) => {
        toast.error('Ekki tókst að sækja birtingu', {
          toastId: 'advert-publication-error',
        })
        setPublicationRequest(null)
        setToggle(false)
      },
      dedupingInterval: 2000,
    },
  )

  const { trigger } = useSWRMutation(
    'updatePublication',
    (_key: string, { arg }: { arg: UpdateAdvertPublicationRequest }) =>
      updateClient.updateAdvertPublication(arg),
  )

  return (
    <>
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span="12/12">
            <Text variant="h3">Birtingar</Text>
          </GridColumn>
        </GridRow>
        <Stack space={[1, 2]}>
          <GridRow>
            <GridColumn span={['12/12', '6/12']}>
              <Text variant="h4">Áætlaður útgáfudagur</Text>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Text variant="h4">Útgáfudagur</Text>
            </GridColumn>
          </GridRow>
          {advert.publications.map((pub) => (
            <GridRow>
              <GridColumn span={['12/12', '6/12']} key={pub.id}>
                <DatePicker
                  backgroundColor="blue"
                  name="scheduledAt"
                  label={`Birting ${pub.version}`}
                  placeholderText=""
                  selected={new Date(pub.scheduledAt)}
                  size="sm"
                  locale="is"
                  minDate={new Date()}
                  handleChange={(date) => {
                    if (!date) return
                    trigger(
                      {
                        id: advert.id,
                        publicationId: pub.id,
                        updateAdvertPublicationDto: {
                          scheduledAt: date.toISOString(),
                        },
                      },
                      {
                        onSuccess: () => {
                          toast.success('Breyting vistuð', {
                            toastId: 'update-publication-success',
                          })
                        },
                        onError: () => {
                          toast.error('Ekki tókst að vista breytingu', {
                            toastId: 'update-publication-error',
                          })
                        },
                      },
                    )
                  }}
                />
              </GridColumn>
              <GridColumn span={['12/12', '6/12']} key={pub.id}>
                <Inline space={[1, 2]} flexWrap="nowrap" alignY="center">
                  <Input
                    backgroundColor="blue"
                    name="publishedAt"
                    readOnly
                    label="Útgáfudagur"
                    value={
                      pub.publishedAt
                        ? format(new Date(pub.publishedAt), 'dd. MMMM. yyyy', {
                            locale: is,
                          })
                        : ''
                    }
                    size="sm"
                    buttons={[
                      {
                        name: 'eye',
                        label: 'Afrita',
                        type: 'outline',
                        onClick: () => {
                          setPublicationRequest({
                            advertId: advert.id,
                            version:
                              GetAdvertPublicationVersionEnum[pub.version],
                          })
                        },
                      },
                    ]}
                  />
                  <DropdownMenu
                    icon="settings"
                    iconType="outline"
                    items={[
                      {
                        title: 'Gefa út birtingu',
                      },
                      {
                        title: 'Fjarlægja birtingu',
                      },
                    ]}
                  />
                </Inline>
              </GridColumn>
            </GridRow>
          ))}
        </Stack>
      </Stack>
      <AdvertModal
        html={html}
        isVisible={toggle}
        onVisiblityChange={setToggle}
        id="advert-publication-modal"
      />
    </>
  )
}
