import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Text,
} from '@dmr.is/ui/components/island-is'

import {
  CreateDivisionEndingDto,
  CreateDivisionMeetingDto,
} from '../../../gen/fetch'

export const DivisionSignatureFields = ({
  fieldErrors,
  setFormState,
  formState,
}: {
  fieldErrors: { [key: string]: string[] } | undefined
  setFormState: React.Dispatch<
    | React.SetStateAction<CreateDivisionMeetingDto | CreateDivisionEndingDto>
    | any
  >
  formState: CreateDivisionMeetingDto | CreateDivisionEndingDto
}) => {
  return (
    <GridRow rowGap={[1, 2]}>
      <GridColumn span="12/12">
        <Text variant="h4">Undirritun</Text>
        <Text
          variant="small"
          fontWeight={fieldErrors?.signature ? 'semiBold' : 'regular'}
          color={(fieldErrors?.signature && 'red600') || 'dark400'}
        >
          Fylla þarf út nafn, staðsetningu eða dagsetningu undirritunar{' '}
          <Text fontWeight="regular" color="red600" as="span">
            *
          </Text>
        </Text>
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <Input
          name="signatureName"
          backgroundColor="blue"
          size="sm"
          label="Undirritun"
          onChange={(e) =>
            setFormState({
              ...formState,
              signature: {
                ...formState.signature,
                name: e.target.value,
              },
            })
          }
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <Input
          name="signatureLocation"
          backgroundColor="blue"
          size="sm"
          label="Staðsetning undirritunar"
          onChange={(e) =>
            setFormState({
              ...formState,
              signature: {
                ...formState.signature,
                location: e.target.value,
              },
            })
          }
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <DatePicker
          locale="is"
          name="signatureDate"
          backgroundColor="blue"
          label="Dagsetning undirritunar"
          size="sm"
          placeholderText=""
          selected={
            formState.signature.date ? new Date(formState.signature.date) : null
          }
          handleChange={(date) => {
            setFormState({
              ...formState,
              signature: {
                ...formState.signature,
                date: date.toISOString(),
              },
            })
          }}
        />
      </GridColumn>
      <GridColumn span={['12/12', '6/12']}>
        <Input
          name="signatureOnBehalfOf"
          backgroundColor="blue"
          size="sm"
          label="Fyrir hönd undirritara"
          onChange={(e) =>
            setFormState({
              ...formState,
              signature: {
                ...formState.signature,
                onBehalfOf: e.target.value,
              },
            })
          }
        />
      </GridColumn>
    </GridRow>
  )
}
