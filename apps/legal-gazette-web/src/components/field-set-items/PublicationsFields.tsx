'use client'

import format from 'date-fns/format'
import is from 'date-fns/locale/is'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { AdvertPublication } from '../../lib/trpc/types'
import { useUpdatePublications } from '../../hooks/useUpdatePublications'

type PublicationsFieldsProps = {
  id: string
  canEdit: boolean
  canPublish: boolean
  isAssignedToMe: boolean
  publications: AdvertPublication[]
}

export const PublicationsFields = ({
  id,
  canEdit,
  canPublish,
  isAssignedToMe,
  publications,
}: PublicationsFieldsProps) => {
  const { createPublication, updatePublication, deletePublication } =
    useUpdatePublications(id)

  const handleCreatePublication = () => {
    createPublication()
  }

  const handleDeletePublication = (publicationId: string) => {
    deletePublication(publicationId)
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

        {publications.map((pub) => {
          const isPublished = Boolean(pub.publishedAt)
          const canModifySchedule = isAssignedToMe && (canPublish || canEdit)
          const isScheduleDisabled = isPublished || !canModifySchedule

          return (
            <GridRow key={pub.id}>
              <GridColumn span={['12/12', '6/12']}>
                <DatePicker
                  disabled={isScheduleDisabled}
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
                    <Box
                      height="full"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeletePublication(pub.id)}
                        disabled={!canEdit}
                      >
                        <Icon
                          size="medium"
                          color="roseTinted400"
                          type="outline"
                          icon="trash"
                        />
                      </button>
                    </Box>
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
                disabled={publications.length >= 3 || !canEdit}
                icon="add"
                iconType="outline"
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
