'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'

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

import { AdvertPublicationDto, StatusDto } from '../../gen/fetch'
import { useUpdatePublications } from '../../hooks/useUpdatePublications'
import { StatusIdEnum } from '../../lib/constants'

type PublicationsFieldsProps = {
  id: string
  canEdit: boolean
  canPublish: boolean
  isAssignedToMe: boolean
  publications: AdvertPublicationDto[]
  advertStatus: StatusDto
}

export const PublicationsFields = ({
  id,
  canEdit,
  canPublish,
  isAssignedToMe,
  publications,
  advertStatus,
}: PublicationsFieldsProps) => {
  const {
    createPublication,
    updatePublication,
    deletePublication,
    publishPublication,
  } = useUpdatePublications(id)

  const handleCreatePublication = () => {
    createPublication()
  }

  const handleDeletePublication = (publicationId: string) => {
    deletePublication(publicationId)
  }

  const handlePublishPublication = (pub: AdvertPublicationDto) => {
    const allowedStatuses: string[] = [
      StatusIdEnum.READY_FOR_PUBLICATION,
      StatusIdEnum.IN_PUBLISHING,
    ]

    if (!allowedStatuses.includes(advertStatus.id)) {
      toast.warning('Auglýsing er ekki í réttri stöðu til birtingar')
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

        {publications.map((pub, i) => {
          const isPublished = Boolean(pub.publishedAt)

          const menuItems = [
            {
              title: 'Gefa út birtingu',
              onClick: () => handlePublishPublication(pub),
            },
          ]

          if (i > 0) {
            menuItems.push({
              title: 'Fjarlægja birtingu',
              onClick: () => handleDeletePublication(pub.id),
            })
          }

          return (
            <GridRow key={pub.id}>
              <GridColumn span={['12/12', '6/12']}>
                <DatePicker
                  disabled={
                    isPublished || !isAssignedToMe || (!canPublish && !canEdit)
                  }
                  backgroundColor="blue"
                  name="scheduledAt"
                  label={`Birting ${pub.version}`}
                  placeholderText=""
                  selected={new Date(pub.scheduledAt)}
                  size="sm"
                  locale="is"
                  minDate={new Date()}
                  handleChange={(date) => {
                    if (date) {
                      updatePublication(pub.id, date.toISOString())
                    }
                  }}
                />
              </GridColumn>

              <GridColumn span={['12/12', '6/12']}>
                <GridRow rowGap={[1, 2]}>
                  <GridColumn span={['10/12']}>
                    <Input
                      backgroundColor="blue"
                      name="publishedAt"
                      readOnly
                      placeholder="Birtist við útgáfu"
                      label="Útgáfudagur"
                      value={
                        pub.publishedAt
                          ? format(
                              new Date(pub.publishedAt),
                              'dd. MMMM. yyyy',
                              {
                                locale: is,
                              },
                            )
                          : ''
                      }
                      size="sm"
                    />
                  </GridColumn>
                  <GridColumn span={['2/12']}>
                    <DropdownMenu
                      disabled={!canPublish}
                      icon="settings"
                      iconType="outline"
                      items={menuItems}
                    />
                  </GridColumn>
                </GridRow>
              </GridColumn>
            </GridRow>
          )
        })}

        <GridRow>
          <GridColumn span="12/12">
            <Inline align="right" alignY="center">
              <Button
                disabled={publications.length >= 3 || !canPublish}
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
    </>
  )
}
