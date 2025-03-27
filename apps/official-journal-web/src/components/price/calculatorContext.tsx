import { createContext, useContext, useEffect, useReducer } from 'react'

import { imageTiers } from '../../lib/utils'

interface PriceCalculatorContextProps {
  currentCase: any
  refetch: () => void
  canEdit: boolean
  feeCodeOptions: any[]
}

const PriceCalculatorContext =
  createContext<PriceCalculatorContextProps | null>(null)

export const useCaseContext = () => {
  const context = useContext(PriceCalculatorContext)
  if (!context)
    throw new Error(
      'useCaseContext must be used within a PriceCalculatorProvider',
    )
  return context
}

type OptionType = { value: string; label: string }

interface State {
  selectedItem?: OptionType
  customBaseDocumentCount?: number
  customBodyLengthCount?: number
  additionalDocuments?: number
  extraWorkCount?: number
  useCustomInputBase: boolean
}

type Action =
  | { type: 'SET_SELECTED_ITEM'; payload?: OptionType }
  | { type: 'SET_CUSTOM_BASE_DOC_COUNT'; payload?: number }
  | { type: 'SET_CUSTOM_BODY_LENGTH_COUNT'; payload?: number }
  | { type: 'SET_EXTRA_WORK_COUNT'; payload?: number }
  | { type: 'SET_ADDITIONAL_DOCUMENTS'; payload?: number }
  | { type: 'TOGGLE_CUSTOM_INPUT_BASE' }
  | { type: 'RESET_CUSTOM_INPUT' }
  | { type: 'INIT_STATE'; payload: Partial<State> }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_SELECTED_ITEM':
      return { ...state, selectedItem: action.payload }
    case 'SET_CUSTOM_BASE_DOC_COUNT':
      return { ...state, customBaseDocumentCount: action.payload }
    case 'SET_CUSTOM_BODY_LENGTH_COUNT':
      return { ...state, customBodyLengthCount: action.payload }
    case 'SET_EXTRA_WORK_COUNT':
      return { ...state, extraWorkCount: action.payload }
    case 'SET_ADDITIONAL_DOCUMENTS':
      return { ...state, additionalDocuments: action.payload }
    case 'TOGGLE_CUSTOM_INPUT_BASE':
      return { ...state, useCustomInputBase: !state.useCustomInputBase }
    case 'RESET_CUSTOM_INPUT':
      return {
        ...state,
        customBaseDocumentCount: 0,
        customBodyLengthCount: 0,
      }
    case 'INIT_STATE':
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export const usePriceCalculatorState = (currentCase: any) => {
  const [state, dispatch] = useReducer(reducer, { useCustomInputBase: false })

  useEffect(() => {
    dispatch({
      type: 'INIT_STATE',
      payload: {
        selectedItem: imageTiers.find(
          (tier) => tier.value === currentCase.transaction?.imageTier,
        ),
        additionalDocuments: Number(
          currentCase.transaction?.customAdditionalDocCount || 0,
        ),
        customBodyLengthCount: Number(
          currentCase.transaction?.customAdditionalCharacterCount || 0,
        ),
        customBaseDocumentCount: Number(
          currentCase.transaction?.customBaseCount || 0,
        ),
        extraWorkCount: Number(currentCase.transaction?.extraWorkCount || 0),
      },
    })
  }, [currentCase.transaction, currentCase.advertDepartment.slug])

  return { state, dispatch }
}
