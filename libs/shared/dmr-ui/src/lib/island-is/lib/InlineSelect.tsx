'use client'

import { type CSSProperties } from 'react'
import ReactSelect, {
  type ClearIndicatorProps,
  components,
  type DropdownIndicatorProps,
  type SingleValue,
  type StylesConfig,
} from 'react-select'

import { theme } from '@dmr.is/island-ui-theme'

import { Icon } from './Icon'
import { islandSelectStyles } from './selectStyles'

export type InlineSelectOption = { value: string; label: string }

type Props = {
  name: string
  options: InlineSelectOption[]
  value: string | null
  placeholder?: string
  noOptionsMessage?: string
  isLoading?: boolean
  isDisabled?: boolean
  isClearable?: boolean
  /** Enable the in-control search box (default true). */
  isSearchable?: boolean
  'aria-label'?: string
  onChange: (value: string | null) => void
}

/**
 * Compact single select for dense contexts — primarily a table cell, where the
 * column header already labels the control so it carries no label of its own.
 *
 * Styled to match the island-ui `Select` at its `xs` size, but built on
 * `react-select` directly (like [MultiSelectFilter]) for one reason: the menu is
 * rendered in a **portal**. `island-ui` wraps every table in an
 * `overflow: auto` div, which clips an in-flow menu the moment it extends past
 * the last row, and its Select cannot portal — the look comes from
 * `.wrapper .menu` descendant selectors that stop matching once the menu leaves
 * the wrapper. Declaring the menu's appearance through `styles` instead keeps it
 * intact wherever it renders.
 */
export const InlineSelect = ({
  name,
  options,
  value,
  placeholder,
  noOptionsMessage,
  isLoading,
  isDisabled,
  isClearable,
  isSearchable = true,
  'aria-label': ariaLabel,
  onChange,
}: Props) => {
  const selected = options.find((o) => o.value === value) ?? null

  return (
    <ReactSelect<InlineSelectOption, false>
      instanceId={name}
      inputId={name}
      name={name}
      aria-label={ariaLabel}
      options={options}
      value={selected}
      placeholder={placeholder}
      noOptionsMessage={() => noOptionsMessage ?? null}
      isLoading={isLoading}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      backspaceRemovesValue={isClearable}
      onChange={(option: SingleValue<InlineSelectOption>) =>
        onChange(option?.value ?? null)
      }
      // Guarded for SSR — this renders on the server before the menu can open.
      menuPortalTarget={typeof document === 'undefined' ? null : document.body}
      // Anchored in document coordinates, so the menu tracks the row when the
      // page scrolls rather than sticking to the viewport.
      menuPosition="absolute"
      menuShouldScrollIntoView={false}
      classNamePrefix="dmr-inline-select"
      styles={customStyles}
      components={{
        DropdownIndicator: ChevronIndicator,
        ClearIndicator: ClearButton,
        IndicatorSeparator: null,
      }}
    />
  )
}

const ChevronIndicator = (
  props: DropdownIndicatorProps<InlineSelectOption, false>,
) => (
  <components.DropdownIndicator {...props}>
    <Icon icon="chevronDown" size="small" color="blue400" ariaHidden />
  </components.DropdownIndicator>
)

const ClearButton = (props: ClearIndicatorProps<InlineSelectOption, false>) => (
  <components.ClearIndicator {...props}>
    <Icon icon="close" size="small" color="blue400" ariaHidden />
  </components.ClearIndicator>
)

const truncated: CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const customStyles: StylesConfig<InlineSelectOption, false> = {
  ...islandSelectStyles<InlineSelectOption, false>({
    controlMinHeight: 32,
    optionPadding: '8px 12px',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 6px',
    flexWrap: 'nowrap',
  }),
  singleValue: (base) => ({
    ...base,
    ...truncated,
    margin: 0,
    fontSize: 14,
    fontWeight: theme.typography.medium,
    color: theme.color.dark400,
  }),
  placeholder: (base) => ({
    ...base,
    ...truncated,
    margin: 0,
    fontSize: 14,
    fontWeight: theme.typography.light,
    color: theme.color.dark300,
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: 14,
    color: theme.color.dark400,
  }),
  // Above the page, below modals — the menu is portaled onto `document.body`,
  // where react-select's default z-index of 1 would sit under sticky chrome.
  menuPortal: (base) => ({ ...base, zIndex: theme.zIndex.belowModal }),
  indicatorsContainer: (base) => ({ ...base, paddingRight: theme.spacing[1] }),
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
}
