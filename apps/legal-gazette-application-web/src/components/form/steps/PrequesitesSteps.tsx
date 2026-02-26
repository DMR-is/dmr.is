import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { BaseApplicationWebSchema } from '@dmr.is/legal-gazette-schemas'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useUpdateApplication } from '../../../hooks/useUpdateApplication'
import { FormStep } from '../../form-step/FormStep'

export const PrerequisitesSteps = () => {
  const { setValue, watch, getValues } =
    useFormContext<BaseApplicationWebSchema>()
  const id = getValues('metadata.applicationId')

  const { updateApplication, isUpdatingApplication } = useUpdateApplication({
    id: id,
    type: 'COMMON',
  })

  const prequisitesAccepted = watch('prequisitesAccepted')

  useEffect(() => {
    setValue('metadata.canProceed', prequisitesAccepted === true)
  }, [prequisitesAccepted])

  const togglePrerequisites = (accepted: boolean) => {
    updateApplication(
      {
        prequisitesAccepted: accepted,
      },
      {
        onSuccessCallback: () => {
          setValue('prequisitesAccepted', accepted)
        },
      },
    )
  }

  return (
    <FormStep
      items={[
        {
          content: (
            <Stack space={[2, 3]}>
              <Text>
                Þú ert að fara að senda inn auglýsingu til birtingar í
                Lögbirtingablað
              </Text>
              <Text>
                Í Lögbirtingablaði eru dómsmálaauglýsingar birtar, svo sem
                stefnur til dóms, úrskurðir um töku búa til opinberra skipta og
                áskoranir um kröfulýsingar, auglýsingar um skiptafundi og
                skiptalok þrotabúa, nauðungarsölur, þar á meðal á fasteignum búa
                sem eru til opinberra skipta, auglýsingar um vogrek, óskilafé og
                fundið fé, auglýsingar um kaupmála hjóna, lögræðissviptingu og
                brottfall hennar, lögboðnar auglýsingar um félög og firmu,
                sérleyfi er stjórnvöld veita, opinber verðlagsákvæði og annað
                það er stjórnvöldum þykir rétt að birta almenningi.
              </Text>
              <Text>
                Um útgáfu Lögbirtingablaðs gilda lög um Stjórnartíðindi og
                Lögbirtingablað nr. 15/2005.
              </Text>
              <Text>
                Á þínu svæði færð þú uppfærða yfirsýn yfir allar auglýsingar
                þínar, innsendar, í vinnslu og útgefnar. Auglýsendur fá rafrænan
                reikning á Ísland.is og kröfu á netbanka vegna kostnaðar við
                birtingu.
              </Text>
              <Checkbox
                id="prequisitesAccepted"
                large={true}
                label="Ég skil ofangreindar upplýsingar og hef umboð til þess að senda inn auglýsingu til birtingar"
                backgroundColor="blue"
                defaultChecked={prequisitesAccepted || false}
                onChange={(e) => togglePrerequisites(e.target.checked)}
                disabled={isUpdatingApplication}
              />
            </Stack>
          ),
        },
      ]}
    />
  )
}
