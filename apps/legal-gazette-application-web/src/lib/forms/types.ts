import z from 'zod'

/**
 * Form field is render inside a form step
 * @field title - Title of the field
 * @field intro - Optional intro text or component for the field
 * @field content - The actual field component to render
 */
export type FormField = {
  title?: string | React.ReactNode
  intro?: React.ReactNode
  content: React.ReactNode
  space?: [number]
}

/**
 * Form step contains multiple form fields
 * in a single "page" or step of the form
 * subsections are shown when fields length > 1
 * @step title - Title displayed of the step/page
 * @step stepTitle - Title displayed in form navigation/stepper
 * @step fields - Array of form fields in the step
 */
export type FormStep = {
  title: string
  stepTitle: string
  fields: FormField[]
  validationSchema?: z.ZodType
}

export type LegalGazetteForm = {
  steps: FormStep[]
}
