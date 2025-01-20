import {
  Box,
  Breadcrumbs,
  Divider,
  GridColumn,
  GridContainer,
  GridRow,
  Input,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { CaseDetailed, CaseTag } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/caseSingle'
import { generateSteps } from '../../lib/utils'
import { FormStepperV2 } from '../form-stepper/FormStepperV2'
import { Section } from '../form-stepper/Section'
import { FormStepperThemes } from '../form-stepper/types'
import { messages as statusMessages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'
import { OJOISelect } from '../select/OJOISelect'
import * as styles from './FormShell.css'
type FormShellType = {
  caseData: CaseDetailed
  tags: CaseTag[]
  children?: React.ReactNode
}

export const FormShell = ({ caseData, children, tags }: FormShellType) => {
  const { formatMessage } = useFormatMessage()
  const steps = generateSteps(caseData)

  const breadcrumbs = [
    {
      title: formatMessage(messages.breadcrumbs.dashboard),
      href: '/',
    },
    {
      title: formatMessage(messages.breadcrumbs.caseOverview),
      href: '/ritstjorn',
    },
    {
      title: formatMessage(messages.breadcrumbs.case),
    },
  ]

  const tagOptions = tags.map((tag) => ({
    label: tag.title,
    value: tag.id,
  }))

  return (
    <Box className={styles.root}>
      <Box
        paddingTop={[0, 4]}
        paddingBottom={[0, 5]}
        width="full"
        height="full"
      >
        <GridContainer>
          <GridRow>
            <GridColumn
              span={['12/12', '12/12', '9/12', '9/12']}
              className={styles.shellContainer}
            >
              <Box
                paddingTop={[3, 6, 8]}
                height="full"
                borderRadius="large"
                background="white"
              >
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  <Breadcrumbs items={breadcrumbs} />
                  <Text marginTop={1} marginBottom={1} variant={'h1'}>
                    {formatMessage(messages.banner.title)}
                  </Text>
                  <Text>{formatMessage(messages.banner.description)}</Text>
                </Box>
                <Box
                  marginBottom={[2, 3, 4]}
                  paddingLeft={[0, 0, 6, 8, 12]}
                  paddingRight={[0, 0, 6, 8, 12]}
                >
                  {children}
                </Box>
              </Box>
            </GridColumn>
            <GridColumn
              span={['12/12', '12/12', '3/12', '3/12']}
              className={styles.sidebarContainer}
            >
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="spaceBetween"
                height="full"
                paddingTop={[0, 0, 8]}
                paddingLeft={[0, 0, 0, 4]}
                className={styles.sidebarInner}
              >
                <Stack space={2}>
                  <OJOIInput
                    disabled
                    name="status"
                    value={caseData.status.title}
                    label={formatMessage(messages.actions.status)}
                    size="sm"
                  />
                  <OJOIInput
                    name="status"
                    disabled
                    value={caseData.communicationStatus.title}
                    type="text"
                    label={formatMessage(messages.actions.communicationsStatus)}
                    size="sm"
                    backgroundColor={'blue'}
                  />
                  <OJOISelect
                    backgroundColor={'white'}
                    name="internal-tag"
                    label={formatMessage(statusMessages.yfirlestur.tag)}
                    defaultValue={tagOptions.find(
                      (tag) => tag.value === caseData.tag.id,
                    )}
                    options={tagOptions}
                  />
                  <Divider weight="purple200" />
                  <FormStepperV2
                    sections={steps.map((step, i) => (
                      <Section
                        key={step.step}
                        isActive={step.isActive}
                        section={step.title}
                        theme={FormStepperThemes.PURPLE}
                        sectionIndex={i}
                        subSections={step.notes?.map((note, i) => (
                          <Text key={i} variant="medium">
                            {note}
                          </Text>
                        ))}
                        isComplete={step.isComplete}
                      />
                    ))}
                  />
                </Stack>
              </Box>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </Box>
  )
}
