import { Input } from '@dmr.is/ui/components/island-is'

type Props = {
  onChange: (value: string) => void
}

export const CreateAdvertApplicant = ({ onChange }: Props) => {
  return (
    <Input
      size="sm"
      backgroundColor="blue"
      name="applicant-national-id"
      label="Kennitala fyrir hönd innsendanda"
      required
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
