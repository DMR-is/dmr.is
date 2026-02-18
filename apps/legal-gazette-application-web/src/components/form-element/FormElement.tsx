import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Input } from '@dmr.is/ui/components/island-is/Input'
import { Select } from '@dmr.is/ui/components/island-is/Select'

import { Editor } from '../editor/Editor'
import { SubmitButton } from '../submit-button/SubmitButton'

type BaseProps = {
  width?: 'half' | 'full'
  paddingBottom?: React.ComponentProps<typeof GridColumn>['paddingBottom']
}

type InputOptions = Omit<
  React.ComponentProps<typeof Input>,
  'size' | 'backgroundColor' | 'name' | 'type'
> & {
  name?: string
  inputType?: React.ComponentProps<typeof Input>['type']
}
type SelectOptions<TOptions> = Omit<
  React.ComponentProps<typeof Select<TOptions>>,
  'size' | 'backgroundColor'
>
type DateOptions = Omit<
  React.ComponentProps<typeof DatePicker>,
  'size' | 'backgroundColor' | 'handleChange' | 'placeholderText'
> & {
  onChange?: (date: Date) => void
  placeholder?: string
}

type EditorProps = React.ComponentProps<typeof Editor>

type SubmitProps = {
  buttonText?: string
  onClick?: () => void
}

type FormElementProps<T> =
  | ({ type: 'text' } & InputOptions)
  | ({ type: 'select' } & SelectOptions<T>)
  | ({ type: 'date' } & DateOptions)
  | ({ type: 'editor' } & EditorProps)
  | ({ type: 'submit' } & SubmitProps)

type Props<T> = BaseProps & FormElementProps<T>

type ColumnSpan = React.ComponentProps<typeof GridColumn>['span']

export const FormElement = <T,>({ width = 'half', ...props }: Props<T>) => {
  const span: ColumnSpan = width === 'half' ? ['12/12', '6/12'] : '12/12'

  let elementToRender

  switch (props.type) {
    case 'text':
      {
        const { type: _type, name, inputType, ...inputProps } = props
        const inputName = name || 'text-input'
        elementToRender = (
          <Input
            size="sm"
            backgroundColor="blue"
            name={inputName}
            type={inputType}
            {...inputProps}
          />
        )
      }
      break
    case 'select':
      {
        const { type: _type, ...selectProps } = props
        elementToRender = (
          <Select size="sm" backgroundColor="blue" {...selectProps} />
        )
      }
      break
    case 'date':
      {
        const { type: _type, placeholder, ...dateProps } = props
        elementToRender = (
          <DatePicker
            locale="is"
            size="sm"
            backgroundColor="blue"
            placeholderText={placeholder}
            handleChange={props.onChange}
            {...dateProps}
          />
        )
      }
      break
    case 'editor': {
      const { type: _type, ...editorProps } = props
      elementToRender = <Editor {...editorProps} />
      break
    }
    case 'submit': {
      const { type: _type, buttonText = 'Staðfesta', onClick } = props
      elementToRender = (
        <SubmitButton onClick={onClick} buttonText={buttonText} />
      )
    }
  }

  return (
    <GridColumn paddingBottom={props.paddingBottom} span={span}>
      {elementToRender}
    </GridColumn>
  )
}
