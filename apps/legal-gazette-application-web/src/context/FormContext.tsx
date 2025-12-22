import { createContext, useContext, useState } from 'react'

type FormContext = {
  goToNextStep: () => void
  goToPreviousStep: () => void
  currentStep: number
}

type FormContextProviderProps = {
  children: React.ReactNode
  totalSteps: number
}

export const FormContext = createContext<FormContext>({} as FormContext)

export const FormContextProvider = ({
  children,
  totalSteps,
}: FormContextProviderProps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const goToNextStep = () => {
    setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev))
  }

  const goToPreviousStep = () => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }

  return (
    <FormContext.Provider
      value={{
        currentStep,
        goToNextStep,
        goToPreviousStep,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export const useLegalGazetteFormContext = () => {
  const context = useContext(FormContext)

  if (!context) {
    throw new Error(
      'useLegalGazetteFormContext must be used within a FormContextProvider',
    )
  }

  return context
}
