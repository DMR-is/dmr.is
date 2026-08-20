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
  control: (base, state) => ({
    ...base,
    minHeight: 32,
    backgroundColor: theme.color.white,
    // Flatten the bottom corners when open so the menu connects flush.
    borderRadius: state.selectProps.menuIsOpen ? '8px 8px 0 0' : 8,
    border: 'none',
    opacity: state.isDisabled ? 0.5 : 1,
    // Match the island-ui input: inset box-shadow border, 3px mint focus ring.
    boxShadow: state.isFocused
      ? `inset 0 0 0 3px ${theme.color.mint400}`
      : `inset 0 0 0 1px ${theme.color.blue200}`,
    transition: 'box-shadow 0.2s',
    ':hover': {
      boxShadow: state.isFocused
        ? `inset 0 0 0 3px ${theme.color.mint400}`
        : `inset 0 0 0 1px ${theme.color.blue400}`,
    },
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
  // Connect the menu to the control and continue the mint focus ring around its
  // sides + bottom, matching the island-ui Select.
  menu: (base) => ({
    ...base,
    marginTop: -3,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    boxShadow: 'none',
    borderTop: `1px solid ${theme.color.blue200}`,
    borderRight: `3px solid ${theme.color.mint400}`,
    borderLeft: `3px solid ${theme.color.mint400}`,
    borderBottom: `3px solid ${theme.color.mint400}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
  }),
  menuList: (base) => ({ ...base, padding: 0 }),
  // Above the page, below modals — the menu is portaled onto `document.body`,
  // where react-select's default z-index of 1 would sit under sticky chrome.
  menuPortal: (base) => ({ ...base, zIndex: theme.zIndex.belowModal }),
  option: (base, state) => ({
    ...base,
    padding: '8px 12px',
    fontSize: 14,
    color: theme.color.dark400,
    backgroundColor: state.isFocused ? theme.color.blue100 : theme.color.white,
    borderBottom: `1px solid ${theme.color.blue200}`,
    cursor: 'pointer',
    ':active': { backgroundColor: theme.color.blue100 },
  }),
  indicatorsContainer: (base) => ({ ...base, paddingRight: theme.spacing[1] }),
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
}
