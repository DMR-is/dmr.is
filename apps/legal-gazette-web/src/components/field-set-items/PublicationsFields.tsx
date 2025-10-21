'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'
import { useEffect, useState } from 'react'

import {
  Button,
  DatePicker,
  DropdownMenu,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Inline, toast } from '@island.is/island-ui/core'

import {
  AdvertPublicationDto,
  GetAdvertPublicationVersionEnum,
  StatusEnum,
} from '../../gen/fetch'
import { useUpdatePublications } from '../../hooks/useUpdatePublications'
import { trpc } from '../../lib/trpc/client'
import { AdvertPublicationModal } from '../modals/AdvertPublicationModal'

type PublicationsFieldsProps = {
  id: string
  canEdit: boolean
  publications: AdvertPublicationDto[]
  advertStatus: StatusEnum
}

export const PublicationsFields = ({
  id,
  canEdit,
  publications,
  advertStatus,
}: PublicationsFieldsProps) => {
  const {
    createPublication,
    updatePublication,
    deletePublication,
    publishPublication,
  } = useUpdatePublications(id)

  const {
    data: publicationData,
    error: publicationError,
    isLoading: isLoadingPublicationData,
  } = trpc.publications.getPublication.useQuery({
    advertId: id,
    version: GetAdvertPublicationVersionEnum.A,
  })

  const [modalVisible, setModalVisible] = useState(false)
  useEffect(() => {
    if (publicationError && !isLoadingPublicationData) {
      toast.error('Ekki tókst að sækja birtingu')
    }
  }, [publicationError, isLoadingPublicationData])

  const handleCreatePublication = () => {
    createPublication()
  }

  const handleDeletePublication = (publicationId: string) => {
    deletePublication(publicationId)
  }

  const handlePublishPublication = (pub: AdvertPublicationDto) => {
    if (
      advertStatus !== StatusEnum.TilbúiðTilÚtgáfu &&
      advertStatus !== StatusEnum.ÚTgefið
    ) {
      toast.warning('Auglýsing ekki tilbúin til útgáfu')
      return
    }

    if (pub.publishedAt) {
      toast.warning('Birting þegar gefin út')
      return
    }

    publishPublication(pub.id)
  }

  return (
    <>
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Text variant="h4">Áætlaður útgáfudagur</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Text variant="h4">Útgáfudagur</Text>
          </GridColumn>
        </GridRow>

        {publications.map((pub) => (
          <GridRow key={pub.id}>
            <GridColumn span={['12/12', '6/12']}>
              <DatePicker
                disabled={!canEdit}
                backgroundColor="blue"
                name="scheduledAt"
                label={`Birting ${pub.version}`}
                placeholderText=""
                selected={new Date(pub.scheduledAt)}
                size="sm"
                locale="is"
                minDate={new Date()}
                // disabled={isUpdatingAdvert}
                handleChange={(date) => {
                  if (date) {
                    updatePublication(pub.id, date.toISOString())
                  }
                }}
              />
            </GridColumn>

            <GridColumn span={['12/12', '6/12']}>
              <Inline space={[1, 2]} flexWrap="nowrap" alignY="center">
                <Input
                  disabled={!canEdit}
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
                      label: 'Skoða',
                      type: 'outline',
                      onClick: () => {
                        setModalVisible(true)
                      },
                    },
                  ]}
                />
                <DropdownMenu
                  disabled={!canEdit}
                  icon="settings"
                  iconType="outline"
                  // loading={isUpdatingAdvert}
                  items={[
                    {
                      title: 'Gefa út birtingu',
                      onClick: () => handlePublishPublication(pub),
                    },
                    {
                      title: 'Fjarlægja birtingu',
                      onClick: () => handleDeletePublication(pub.id),
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
                disabled={publications.length >= 3 || !canEdit}
                icon="add"
                iconType="outline"
                // loading={isUpdatingAdvert}
                onClick={handleCreatePublication}
              >
                Bæta við birtingu
              </Button>
            </Inline>
          </GridColumn>
        </GridRow>
      </Stack>
      {publicationData?.html && modalVisible && (
        <AdvertPublicationModal
          html={publicationData.html}
          isVisible={modalVisible}
          onVisibilityChange={(vis) => {
            setModalVisible(vis)
          }}
          id="advert-publication-modal"
        />
      )}
    </>
  )
}
