import { Fragment, useEffect, useState } from 'react'

import { Box, GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { AdvertCorrection } from '../../gen/fetch'
import { UpdateAvertAndCorrectionTriggerArgs } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { formatDate } from '../../lib/utils'
import { AddCorrection } from './AddCorrection'
import { DeleteCorrections } from './DeleteButton'
import { messages } from './messages'
type Props = {
  caseId: string
  advertCorrections?: AdvertCorrection[]
  isFixing?: boolean
  onCorrectionAdd: (correction: UpdateAvertAndCorrectionTriggerArgs) => void
  onDeleteCorrection: () => void
}

export const Corrections = ({
  caseId,
  advertCorrections,
  isFixing,
  onCorrectionAdd,
  onDeleteCorrection,
}: Props) => {
  const { formatMessage } = useFormatMessage()
  const [localCorrection, setLocalCorrection] = useState<AdvertCorrection>()

  if (!advertCorrections?.length) {
    null
  }

  useEffect(() => {
    if (!isFixing) {
      setLocalCorrection(undefined)
    }
  }, [isFixing])

  const adCorrections = advertCorrections ?? []
  const lCorrection = localCorrection ? [localCorrection] : []
  const corrections = [...lCorrection, ...adCorrections]

  return (
    <Box
      borderRadius="large"
      padding={[2, 3, 5]}
      marginTop={2}
      background="purple100"
    >
      <Box display="flex" justifyContent="spaceBetween" alignItems="center">
        <Text variant="h5">{formatMessage(messages.corrections.title)}</Text>
      </Box>
      <Box>
        {corrections?.map((c, i) => {
          return (
            <Fragment key={c.id}>
              <Box
                display="flex"
                flexDirection="column"
                rowGap={1}
                padding={[1, 2, 3]}
                borderBottomWidth="standard"
                borderColor="purple200"
              >
                <GridRow marginBottom={2} rowGap={2} alignItems="center">
                  <GridColumn span={['6/12']}>
                    <Text>{c.title}</Text>
                  </GridColumn>
                  <GridColumn span={['6/12']}>
                    <Text textAlign="right" whiteSpace="nowrap">
                      {c.createdDate ? formatDate(c.createdDate) : ''}
                      {c.id === 'new' ? 'Nýtt' : ''}
                    </Text>
                  </GridColumn>
                  <GridColumn span={['12/12']}>
                    <Text variant="small">{c.description}</Text>
                  </GridColumn>
                </GridRow>
                <GridRow alignItems="stretch">
                  {c.id === 'new' ? (
                    <GridColumn span={['6/12']}>
                      <DeleteCorrections
                        onDelete={() => {
                          onDeleteCorrection()
                          setLocalCorrection(undefined)
                        }}
                        title={c.title}
                      />
                    </GridColumn>
                  ) : undefined}
                  <GridColumn span={c.id === 'new' ? ['6/12'] : ['12/12']}>
                    <Box
                      display="flex"
                      alignItems="flexEnd"
                      justifyContent="flexEnd"
                    >
                      <Text color="blue600" variant="small">
                        <a href="#">Link á skjal</a>
                      </Text>
                    </Box>
                  </GridColumn>
                </GridRow>
              </Box>
            </Fragment>
          )
        })}
        {isFixing ? (
          <Box marginTop={4} padding={4} background="white">
            <Box
              borderTopWidth={isFixing ? 'standard' : undefined}
              borderColor="blue200"
            >
              <AddCorrection
                onAddSuccess={(correction) => {
                  onCorrectionAdd(correction)
                  setLocalCorrection({
                    id: 'new',
                    title: correction.title,
                    description: correction.description,
                    advertId: '',
                    documentHtml: '',
                    documentPdfUrl: '',
                    createdDate: '',
                    updatedDate: '',
                  })
                }}
                caseId={caseId}
              />
            </Box>
          </Box>
        ) : undefined}
      </Box>
    </Box>
  )
}
