import { Fragment } from 'react'

import { Box, GridColumn, GridRow, Text } from '@island.is/island-ui/core'

import { useCaseContext } from '../../hooks/useCaseContext'
import { formatDate } from '../../lib/utils'
import { AddCorrection } from './AddCorrection'
import { DeleteCorrections } from './DeleteButton'

export const Corrections = () => {
  const { currentCase, corrections, setLocalCorrection } = useCaseContext()

  return (
    <Box
      borderRadius="large"
      padding={[2, 3, 5]}
      marginTop={2}
      background="purple100"
    >
      <Box>
        {corrections?.map((c) => {
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
                          setLocalCorrection(undefined)
                        }}
                        confirmText={`Staðfesting: '${c.title}' verður eytt út.`}
                        confirmButton="Eyða"
                        icon="trash"
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
        <Box marginTop={4} padding={4} background="white">
          <Box borderTopWidth={'standard'} borderColor="blue200">
            <AddCorrection
              onAddSuccess={(correction) => {
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
              caseId={currentCase.id}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
