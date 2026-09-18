import { type StylesConfig } from 'react-select'

import { theme } from '@dmr.is/island-ui-theme'

type SharedKeys = 'control' | 'menu' | 'menuList' | 'option'

type Options = {
  /** Height of the closed control. */
  controlMinHeight: number
  /** Menu option padding — the only thing that differs between our selects. */
  optionPadding: string
  /**
   * Stacking for an in-flow menu. A portaled menu leaves it unset and stacks
   * through `menuPortal` instead, since the portal is what sits in `body`.
   */
  menuZIndex?: number
}

/**
 * The parts of a `react-select` appearance that make it look like the island-ui
 * `Select`, shared by the bespoke selects in this folder — [InlineSelect] and
 * [MultiSelectFilter], both of which need something island-ui's own Select
 * cannot do (a portaled menu, a collapsed value container) and so restate its
 * looks through `styles`.
 *
 * Only the keys that were identical between the two live here. Padding, the
 * indicators and the value container stay with each component, which is where
 * they genuinely differ.
 */
export const islandSelectStyles = <Option, IsMulti extends boolean>({
  controlMinHeight,
  optionPadding,
  menuZIndex,
}: Options): Pick<StylesConfig<Option, IsMulti>, SharedKeys> => ({
  control: (base, state) => ({
    ...base,
    minHeight: controlMinHeight,
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
    ...(menuZIndex === undefined ? {} : { zIndex: menuZIndex }),
  }),
  menuList: (base) => ({ ...base, padding: 0 }),
  option: (base, state) => ({
    ...base,
    padding: optionPadding,
    fontSize: 14,
    color: theme.color.dark400,
    backgroundColor: state.isFocused ? theme.color.blue100 : theme.color.white,
    borderBottom: `1px solid ${theme.color.blue200}`,
    cursor: 'pointer',
    ':active': { backgroundColor: theme.color.blue100 },
  }),
})
