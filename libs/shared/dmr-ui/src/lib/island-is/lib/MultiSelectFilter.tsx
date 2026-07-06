'use client'

import { type CSSProperties, useEffect, useMemo, useRef } from 'react'
import ReactSelect, {
  type ClearIndicatorProps,
  components,
  type DropdownIndicatorProps,
  type MenuListProps,
  type MultiValue,
  type OptionProps,
  type StylesConfig,
  type ValueContainerProps,
} from 'react-select'

import { theme } from '@dmr.is/island-ui-theme'

import { Icon } from './Icon'
import { Text } from './Text'

import { useVirtualizer } from '@tanstack/react-virtual'

export type MultiSelectOption = { value: string; label: string }

type Props = {
  name: string
  /** Optional eyebrow heading rendered above the control. */
  label?: string
  placeholder?: string
  noOptionsMessage?: string
  options: MultiSelectOption[]
  selected: string[]
  isLoading?: boolean
  /** Enable the in-control search box (default true). */
  isSearchable?: boolean
  /** Renders the summary pill text; defaults to `${n} valdir`. */
  countLabel?: (count: number) => string
  onChange: (values: string[]) => void
}

const defaultCountLabel = (count: number) => `${count} valdir`

/**
 * Multi-select filter styled to match the island-ui `Select` input. Differs
 * from a plain multi-select in three ways requested for the company filters:
 *   1. selected options collapse into a single count pill instead of one chip
 *      per value (keeps the control compact in narrow columns),
 *   2. each menu option shows a checkbox indicating selection, and
 *   3. selected options float to the top of the menu.
 */
export const MultiSelectFilter = ({
  name,
  label,
  placeholder,
  noOptionsMessage,
  options,
  selected,
  isLoading,
  isSearchable = true,
  countLabel,
  onChange,
}: Props) => {
  const value = useMemo(
    () =>
      selected.map(
        (v) => options.find((o) => o.value === v) ?? { value: v, label: v },
      ),
    [selected, options],
  )

  // Selected options first, each group keeping its original order.
  const displayedOptions = useMemo(() => {
    const selectedSet = new Set(selected)
    const chosen: MultiSelectOption[] = []
    const rest: MultiSelectOption[] = []
    for (const option of options) {
      ;(selectedSet.has(option.value) ? chosen : rest).push(option)
    }
    return [...chosen, ...rest]
  }, [options, selected])

  // Stable component set — react-select remounts the whole menu if the
  // `components` identity changes, so this must not be rebuilt every render.
  const selectComponents = useMemo(
    () => makeComponents(countLabel ?? defaultCountLabel),
    [countLabel],
  )

  return (
    <div>
      {label && (
        <Text variant="eyebrow" marginBottom={1}>
          {label}
        </Text>
      )}
      <ReactSelect<MultiSelectOption, true>
        instanceId={name}
        inputId={name}
        name={name}
        isMulti
        isSearchable={isSearchable}
        isClearable
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        backspaceRemovesValue={false}
        isLoading={isLoading}
        options={displayedOptions}
        value={value}
        placeholder={placeholder}
        noOptionsMessage={() => noOptionsMessage ?? null}
        onChange={(opts: MultiValue<MultiSelectOption>) =>
          onChange(opts.map((o) => o.value))
        }
        classNamePrefix="dmr-multiselect"
        styles={customStyles}
        components={selectComponents}
      />
    </div>
  )
}

const NullComponent = () => null

const CheckboxOption = (props: OptionProps<MultiSelectOption, true>) => (
  <components.Option {...props}>
    <span style={optionRowStyle}>
      <span
        style={{
          ...checkboxStyle,
          ...(props.isSelected ? checkboxCheckedStyle : {}),
        }}
      >
        {props.isSelected && (
          <Icon icon="checkmark" size="small" color="white" ariaHidden />
        )}
      </span>
      <span>{props.label}</span>
    </span>
  </components.Option>
)

const makeComponents = (countLabel: (count: number) => string) => {
  const CountValueContainer = ({
    children,
    ...props
  }: ValueContainerProps<MultiSelectOption, true>) => {
    const count = props.getValue().length
    return (
      <components.ValueContainer {...props}>
        {count > 0 && <span style={pillStyle}>{countLabel(count)}</span>}
        {children}
      </components.ValueContainer>
    )
  }

  return {
    Option: CheckboxOption,
    ValueContainer: CountValueContainer,
    MenuList: VirtualizedMenuList,
    // The count pill in the ValueContainer replaces per-value chips.
    MultiValue: NullComponent,
    DropdownIndicator: ChevronIndicator,
    ClearIndicator: ClearButton,
    IndicatorSeparator: NullComponent,
  }
}

/**
 * Windowed menu — only the visible option rows are mounted, so a large list
 * (e.g. the ~665 ÍSAT codes) stays responsive. Row heights are measured, so
 * options that wrap to multiple lines are handled without a fixed height.
 */
const VirtualizedMenuList = (props: MenuListProps<MultiSelectOption, true>) => {
  const { children, maxHeight, focusedOption } = props
  const items = Array.isArray(children) ? children : null
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items?.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  // Keep the keyboard-focused option scrolled into view (react-select can't do
  // it itself once rows are virtualized).
  const focusedIndex = items
    ? items.findIndex(
        (child) =>
          (child as { props?: { data?: MultiSelectOption } }).props?.data ===
          focusedOption,
      )
    : -1

  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex)
    }
  }, [focusedIndex, virtualizer])

  // Non-array children (loading / no-options message) render normally.
  if (!items) {
    return <components.MenuList {...props}>{children}</components.MenuList>
  }

  return (
    <div ref={scrollRef} style={{ maxHeight, overflowY: 'auto' }}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}

const ChevronIndicator = (
  props: DropdownIndicatorProps<MultiSelectOption, true>,
) => (
  <components.DropdownIndicator {...props}>
    <Icon icon="chevronDown" size="large" color="blue400" ariaHidden />
  </components.DropdownIndicator>
)

const ClearButton = (props: ClearIndicatorProps<MultiSelectOption, true>) => (
  <components.ClearIndicator {...props}>
    <Icon icon="close" color="blue400" ariaHidden />
  </components.ClearIndicator>
)

const optionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flex: '0 0 auto',
  backgroundColor: theme.color.blue200,
  color: theme.color.blue600,
  fontWeight: theme.typography.medium,
  borderRadius: theme.border.radius.large,
  padding: '2px 8px',
  fontSize: 14,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}

const checkboxStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  width: 20,
  height: 20,
  borderRadius: 4,
  border: `1px solid ${theme.color.blue400}`,
  backgroundColor: theme.color.white,
}

const checkboxCheckedStyle: CSSProperties = {
  backgroundColor: theme.color.blue400,
}

const customStyles: StylesConfig<MultiSelectOption, true> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    backgroundColor: theme.color.white,
    // Flatten the bottom corners when open so the menu connects flush.
    borderRadius: state.selectProps.menuIsOpen ? '8px 8px 0 0' : 8,
    border: 'none',
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
    padding: '4px 8px',
    gap: 6,
    flexWrap: 'nowrap',
  }),
  placeholder: (base) => ({
    ...base,
    color: theme.color.dark400,
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: theme.color.dark400,
  }),
  // Connect the menu to the control and continue the mint focus ring around
  // its sides + bottom, matching the island-ui Select.
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
    zIndex: 20,
  }),
  menuList: (base) => ({ ...base, padding: 0 }),
  option: (base, state) => ({
    ...base,
    padding: '16px 24px',
    fontSize: 14,
    color: theme.color.dark400,
    backgroundColor: state.isFocused ? theme.color.blue100 : theme.color.white,
    borderBottom: `1px solid ${theme.color.blue200}`,
    cursor: 'pointer',
    ':active': { backgroundColor: theme.color.blue100 },
  }),
  // Inset the indicators from the right edge to match the island-ui Select,
  // where the chevron sits well inside rather than hugging the border.
  indicatorsContainer: (base) => ({ ...base, paddingRight: theme.spacing[3] }),
  dropdownIndicator: (base) => ({ ...base, color: theme.color.blue400 }),
  clearIndicator: (base) => ({ ...base, color: theme.color.blue400 }),
}
