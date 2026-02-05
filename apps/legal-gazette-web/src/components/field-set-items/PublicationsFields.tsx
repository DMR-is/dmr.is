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
  publications: AdvertPublicationDto[]
  advertStatus: StatusDto
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

  const handleCreatePublication = () => {
    createPublication()
  }

  const handleDeletePublication = (publicationId: string) => {
    deletePublication(publicationId)
  }

  const handlePublishPublication = (pub: AdvertPublicationDto) => {
    if (
      advertStatus.id !== StatusIdEnum.READY_FOR_PUBLICATION &&
      advertStatus.id !== StatusIdEnum.PUBLISHED
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

        {publications.map((pub, index) => (
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
              <GridRow rowGap={[1, 2]}>
                <GridColumn span={['10/12']}>
                  <Input
                    disabled={!canEdit}
                    backgroundColor="blue"
                    name="publishedAt"
                    readOnly
                    placeholder="Birtist við útgáfu"
                    label="Útgáfudagur"
                    value={
                      pub.publishedAt
                        ? format(new Date(pub.publishedAt), 'dd. MMMM. yyyy', {
                            locale: is,
                          })
                        : ''
                    }
                    size="sm"
                  />
                </GridColumn>
                <GridColumn span={['2/12']}>
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
                      ...(index !== 0
                        ? [
                            {
                              title: 'Fjarlægja birtingu',
                              onClick: () => handleDeletePublication(pub.id),
                            },
                          ]
                        : []),
                    ]}
                  />
                </GridColumn>
              </GridRow>
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
    </>
  )
}
