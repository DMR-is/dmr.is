import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import {
  AlertMessage,
  Box,
  Inline,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'

import { useFilters } from '../../../../hooks/useFilters'
import { usePublicationsHtml } from '../../../../hooks/usePublicationsHtml'

type Props = {
  openModal: boolean
  setOpenModal: (open: boolean) => void
}

export const ViewPublicationsOnPage = ({ openModal, setOpenModal }: Props) => {
  const { data, error, totalItems } = usePublicationsHtml()
  const { filters } = useFilters()

  console.log(data)
  return (
    <Modal
      isVisible={openModal}
      toggleClose={() => {
        setTimeout(() => {
          setOpenModal(false)
        }, 300)
      }}
    >
      <Box padding={2} paddingTop={0} paddingBottom={6}>
        {error ? (
          <AlertMessage
            type="error"
            title="Villa kom upp"
            message="Ekki tókst að sækja birtingar, vinsamlegast reynið aftur síðar"
          />
        ) : (
          <>
            <Box marginBottom={4}>
              <Inline justifyContent="spaceBetween" alignY="bottom">
                <Text variant="h2">Auglýsingar á síðu</Text>
                <Box>
                  {totalItems ? (
                    <Text>
                      <strong>
                        {filters.page > 1
                          ? filters.pageSize * (filters.page - 1) + 1
                          : 1}
                      </strong>
                      {' – '}
                      <strong>
                        {filters.page * filters.pageSize < totalItems
                          ? filters.page * filters.pageSize
                          : totalItems}
                      </strong>
                      {' af '}
                      <strong>{totalItems}</strong> niðurstöðum
                    </Text>
                  ) : null}
                </Box>
              </Inline>
            </Box>
            <Stack space={4}>
              {data?.result.map((ad) => (
                <AdvertDisplay
                  key={ad.publication.id}
                  withStyles
                  html={ad.html}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Modal>
  )
}
