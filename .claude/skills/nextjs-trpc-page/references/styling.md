# Styling Guidelines

Island.is design system usage for Next.js components.

## Layout Components

### GridContainer

Use for page-level horizontal containment. Automatically handles responsive padding and max-width.

```tsx
import { GridContainer } from '@dmr.is/ui/components/island-is'

<GridContainer>
  {/* Page content */}
</GridContainer>
```

### Stack

Use for vertical spacing. Prefer `Stack` over manual margins.

```tsx
import { Stack } from '@dmr.is/ui/components/island-is'

<Stack space={4}>
  <ComponentOne />
  <ComponentTwo />
  <ComponentThree />
</Stack>
```

**Spacing scale (space prop: 1-10):**
- `space={1}` = 4px
- `space={2}` = 8px
- `space={3}` = 16px
- `space={4}` = 24px
- `space={5}` = 32px
- `space={6}` = 48px
- `space={8}` = 80px
- `space={10}` = 120px

**Usage guidelines:**
- Small gaps between related items: `space={2}`
- Default spacing between sections: `space={3}` or `space={4}`
- Large spacing between major sections: `space={6}` or `space={8}`

### Box

Use for custom layouts with flex/grid properties.

```tsx
import { Box } from '@dmr.is/ui/components/island-is'

// Horizontal layout
<Box display="flex" justifyContent="spaceBetween" alignItems="center">
  <Text>Left</Text>
  <Button>Right</Button>
</Box>

// With gaps
<Box display="flex" columnGap={2}>
  <Button>Cancel</Button>
  <Button>Save</Button>
</Box>

// With padding and borders
<Box padding={3} border="standard" borderRadius="large">
  <Text>Card content</Text>
</Box>
```

**Common flex properties:**
- `display="flex"` or `display="inlineFlex"`
- `flexDirection="row"` | `"column"` | `"rowReverse"` | `"columnReverse"`
- `justifyContent="flexStart"` | `"flexEnd"` | `"center"` | `"spaceBetween"` | `"spaceAround"`
- `alignItems="flexStart"` | `"flexEnd"` | `"center"` | `"stretch"`
- `columnGap={1-10}` or `rowGap={1-10}`

**Padding and spacing:**
- `padding={1-10}` - All sides
- `paddingX={1-10}` - Left and right
- `paddingY={1-10}` - Top and bottom
- `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`

**Borders:**
- `border="standard"` | `"focus"` | `"none"`
- `borderRadius="standard"` | `"large"` | `"circle"` | `"none"`

## Common Layout Pattern

```tsx
<GridContainer>
  <Stack space={4}>
    {/* Header with actions */}
    <Box display="flex" justifyContent="spaceBetween" alignItems="center">
      <Text variant="h1">Page Title</Text>
      <Button>Action</Button>
    </Box>

    {/* Content sections */}
    <Stack space={3}>
      <ComponentOne />
      <ComponentTwo />
    </Stack>
  </Stack>
</GridContainer>
```

## Typography

### Text Component

```tsx
import { Text } from '@dmr.is/ui/components/island-is'

<Text variant="h1">Heading 1</Text>
<Text variant="h2">Heading 2</Text>
<Text variant="h3">Heading 3</Text>
<Text variant="h4">Heading 4</Text>
<Text variant="h5">Heading 5</Text>
<Text>Regular text (default)</Text>
<Text variant="small">Small text</Text>
<Text variant="eyebrow">Eyebrow text</Text>
```

**Properties:**
- `variant` - Typography style
- `as` - HTML element to render (e.g., `as="p"`, `as="span"`)
- `color` - Text color
- `fontWeight` - "light" | "regular" | "medium" | "semiBold" | "bold"
- `truncate` - Boolean, adds text overflow ellipsis

## Buttons

```tsx
import { Button } from '@dmr.is/ui/components/island-is'

// Primary action
<Button>Save</Button>

// Secondary/ghost
<Button variant="ghost">Cancel</Button>

// Destructive
<Button colorScheme="destructive">Delete</Button>
<Button variant="ghost" colorScheme="destructive">Delete</Button>

// With loading state
<Button loading={isPending}>Save</Button>

// Disabled
<Button disabled>Cannot click</Button>

// Sizes
<Button size="small">Small</Button>
<Button>Default (medium)</Button>
<Button size="large">Large</Button>
```

**Button variants:**
- Default (primary) - Solid background, high emphasis
- `variant="ghost"` - No background, low emphasis
- `variant="text"` - Text only, lowest emphasis

**Color schemes:**
- Default (blue) - Primary actions
- `colorScheme="destructive"` - Delete/remove actions

## Form Components

### Input

```tsx
import { Input } from '@dmr.is/ui/components/island-is'

// Text input
<Input
  label="Title"
  {...register('title')}
  errorMessage={errors.title?.message}
  required
/>

// Textarea
<Input
  label="Description"
  {...register('description')}
  textarea
  rows={4}
/>

// With placeholder
<Input
  label="Email"
  placeholder="your@email.com"
/>

// Disabled
<Input label="Locked" disabled value="Cannot edit" />
```

**Properties:**
- `label` - Field label (string)
- `errorMessage` - Validation error to display
- `required` - Shows required indicator
- `textarea` - Renders textarea instead of input
- `rows` - Textarea rows (default: 3)
- `placeholder` - Input placeholder
- `disabled` - Disables input
- All standard input props (type, value, onChange, etc.)

### Select

```tsx
import { Select } from '@dmr.is/ui/components/island-is'

<Select
  label="Category"
  {...register('categoryId')}
  errorMessage={errors.categoryId?.message}
>
  <option value="">Select...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

## Feedback Components

### Toast Notifications

```tsx
import { toast } from '@dmr.is/ui/components/island-is'

// Success
toast.success('Item saved successfully')

// Error
toast.error('Failed to save item')

// Info
toast.info('Processing...')

// Warning
toast.warning('Are you sure?')
```

### Loading States

```tsx
import { LoadingDots } from '@dmr.is/ui/components/island-is'

// Simple loading indicator
<LoadingDots />

// In a container
<GridContainer>
  <Stack space={3}>
    <LoadingDots />
  </Stack>
</GridContainer>
```

## Cards and Containers

### Card Pattern

```tsx
<Box padding={3} border="standard" borderRadius="large">
  <Stack space={2}>
    <Text variant="h4">Card Title</Text>
    <Text>Card content</Text>
  </Stack>
</Box>
```

### Card with Actions

```tsx
<Box padding={3} border="standard" borderRadius="large">
  <Stack space={2}>
    <Box display="flex" justifyContent="spaceBetween" alignItems="center">
      <Text variant="h4">Card Title</Text>
      <Button size="small" variant="ghost">Action</Button>
    </Box>
    <Text>Card content</Text>
  </Stack>
</Box>
```

## Complete Example

```tsx
'use client'

import {
  Box,
  Button,
  GridContainer,
  Input,
  Stack,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'

export function ExampleComponent() {
  const handleSubmit = () => {
    toast.success('Submitted!')
  }

  return (
    <GridContainer>
      <Stack space={4}>
        {/* Header */}
        <Box display="flex" justifyContent="spaceBetween" alignItems="center">
          <Text variant="h1">Form Title</Text>
          <Button variant="ghost">Cancel</Button>
        </Box>

        {/* Form fields */}
        <Stack space={3}>
          <Input label="Name" required />
          <Input label="Description" textarea rows={4} />
        </Stack>

        {/* Actions */}
        <Box display="flex" justifyContent="flexEnd" columnGap={2}>
          <Button variant="ghost">Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Box>
      </Stack>
    </GridContainer>
  )
}
```
