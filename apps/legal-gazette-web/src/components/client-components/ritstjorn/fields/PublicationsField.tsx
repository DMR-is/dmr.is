'use client'

import { useRouter } from 'next/navigation'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { useState } from 'react'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

import {
  Button,
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
  DeleteAdvertPublicationRequest,
  GetAdvertPublicationRequest,
  GetAdvertPublicationVersionEnum,
  PublishAdvertPublicationRequest,
  StatusEnum,
  UpdateAdvertPublicationRequest,
} from '../../../../gen/fetch'
import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useClient } from '../../../../hooks/useClient'
import { AdvertModal } from '../../modals/AdvertPublicationModal'

export const PublicationsFields = () => {
  const { advert } = useAdvertContext()
  const router = useRouter()

  const publicationClient = useClient('AdvertPublicationApi')
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
      dedupingInterval: 0,
    },
  )

  const { trigger: updatePublicationTrigger } = useSWRMutation(
    'updatePublication',
    (_key: string, { arg }: { arg: UpdateAdvertPublicationRequest }) =>
      publicationClient.updateAdvertPublication(arg),
  )

  const { trigger: deletePublicationTrigger, isMutating: isDeleting } =
    useSWRMutation(
      'deletePublication',
      (_key: string, { arg }: { arg: DeleteAdvertPublicationRequest }) =>
        publicationClient.deleteAdvertPublication(arg),
    )

  const { trigger: createPublicationTrigger, isMutating: isCreating } =
    useSWRMutation(
      'createPublication',
      (_key: string, { arg }: { arg: { advertId: string } }) =>
        publicationClient.createAdvertPublication(arg),
      {
        onSuccess: () => {
          toast.success('Birting bætt við', {
            toastId: 'create-publication-success',
          })
          router.refresh()
        },
        onError: () => {
          toast.error('Ekki tókst að bæta við birtingu', {
            toastId: 'create-publication-error',
          })
        },
      },
    )

  const { trigger: publishAdvertPublicationTrigger } = useSWRMutation(
    'publishAdvert',
    (_key: string, { arg }: { arg: PublishAdvertPublicationRequest }) =>
      publicationClient.publishAdvertPublication(arg),
    {
      onSuccess: () => {
        toast.success('Birting gefin út', {
          toastId: 'publish-advert-success',
        })
        router.refresh()
      },
      onError: () => {
        toast.error('Ekki tókst að gefa birtingu út', {
          toastId: 'publish-advert-error',
        })
      },
    },
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
            <GridRow key={pub.id}>
              <GridColumn span={['12/12', '6/12']}>
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
                    updatePublicationTrigger(
                      {
                        advertId: advert.id,
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
              <GridColumn span={['12/12', '6/12']}>
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
                    loading={isDeleting}
                    items={[
                      {
                        title: 'Gefa út birtingu',
                        onClick: () => {
                          if (
                            advert.status.title !==
                              StatusEnum.TilbúiðTilÚtgáfu &&
                            advert.status.title !== StatusEnum.Útgefið
                          ) {
                            toast.warning('Auglýsing ekki tilbúin til útgáfu', {
                              toastId: 'publish-publication-error',
                            })
                            return
                          }

                          if (pub.publishedAt) {
                            toast.warning('Birting þegar gefin út', {
                              toastId: 'publish-publication-error',
                            })
                            return
                          }

                          publishAdvertPublicationTrigger(
                            {
                              advertId: advert.id,
                              publicationId: pub.id,
                            },
                            {
                              onSuccess: () => {
                                toast.success('Birting gefin út', {
                                  toastId: 'publish-publication-success',
                                })

                                router.refresh()
                              },
                              onError: () => {
                                toast.error('Ekki tókst að gefa út birtingu', {
                                  toastId: 'publish-publication-error',
                                })
                              },
                            },
                          )
                        },
                      },
                      {
                        title: 'Fjarlægja birtingu',
                        onClick: () => {
                          deletePublicationTrigger(
                            {
                              advertId: advert.id,
                              publicationId: pub.id,
                            },
                            {
                              onSuccess: () => {
                                toast.success('Birting fjarlægð', {
                                  toastId: 'delete-publication-success',
                                })

                                router.refresh()
                              },
                              onError: () => {
                                toast.error(
                                  'Ekki tókst að fjarlægja birtingu',
                                  {
                                    toastId: 'delete-publication-error',
                                  },
                                )
                              },
                            },
                          )
                        },
                      },
                    ]}
                  />
                </Inline>
              </GridColumn>
            </GridRow>
          ))}
          <GridRow>
            <GridColumn span="12/12">
              <Inline align="right" alignY="center">
                <Button
                  disabled={advert.publications.length >= 3}
                  icon="add"
                  iconType="outline"
                  loading={isCreating}
                  onClick={() =>
                    createPublicationTrigger({ advertId: advert.id })
                  }
                >
                  Bæta við birtingu
                </Button>
              </Inline>
            </GridColumn>
          </GridRow>
        </Stack>
      </Stack>
      <AdvertModal
        html={html}
        isVisible={toggle}
        onVisibilityChange={(vis) => {
          setToggle(vis)
          setPublicationRequest(null)
        }}
        id="advert-publication-modal"
      />
    </>
  )
}
