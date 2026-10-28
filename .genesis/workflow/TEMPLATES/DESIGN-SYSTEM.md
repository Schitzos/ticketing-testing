# DESIGN-SYSTEM.md — UI Design System

> Generated from GENESIS grooming decisions.
> Fill `{...}` placeholders with actual project values.

---

## Overview

**UI Library:** {component library}
**Styling:** {CSS-in-JS | Tailwind | CSS Modules | other}
**Design Tokens:** {where defined}

---

## Color Palette

### Brand Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary | `{#hex}` | Primary actions, links |
| Secondary | `{#hex}` | Secondary actions |
| Accent | `{#hex}` | Highlights, badges |

### Semantic Colors
| Name | Value | Usage |
|------|-------|-------|
| Success | `{#hex}` | Success states, confirmations |
| Warning | `{#hex}` | Warning states, cautions |
| Error | `{#hex}` | Error states, destructive actions |
| Info | `{#hex}` | Informational states |

### Neutral Colors
| Name | Value | Usage |
|------|-------|-------|
| Background | `{#hex}` | Page background |
| Surface | `{#hex}` | Card/panel background |
| Border | `{#hex}` | Borders, dividers |
| Text Primary | `{#hex}` | Main text |
| Text Secondary | `{#hex}` | Secondary text |
| Text Muted | `{#hex}` | Disabled, placeholder |

---

## Typography

### Font Families
| Purpose | Font | Fallback |
|---------|------|----------|
| Heading | `{font}` | `{fallback}` |
| Body | `{font}` | `{fallback}` |
| Mono | `{font}` | `{fallback}` |

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| h1 | `{size}` | `{lh}` | `{weight}` | Page titles |
| h2 | `{size}` | `{lh}` | `{weight}` | Section titles |
| h3 | `{size}` | `{lh}` | `{weight}` | Subsections |
| body | `{size}` | `{lh}` | `{weight}` | Main content |
| small | `{size}` | `{lh}` | `{weight}` | Captions, labels |

---

## Spacing

### Scale
| Token | Value | Usage |
|-------|-------|-------|
| xs | `{4px}` | Tight spacing |
| sm | `{8px}` | Small gaps |
| md | `{16px}` | Default spacing |
| lg | `{24px}` | Section spacing |
| xl | `{32px}` | Large gaps |
| 2xl | `{48px}` | Page sections |

### Layout Grid
- **Columns:** {number}
- **Gutter:** {size}
- **Margin:** {size}
- **Max width:** {size}

---

## Breakpoints

| Name | Min Width | Target |
|------|-----------|--------|
| mobile | `0px` | Phones |
| tablet | `{768px}` | Tablets |
| desktop | `{1024px}` | Desktops |
| wide | `{1440px}` | Large screens |

---

## Components

### Button

**Variants:**
| Variant | Usage |
|---------|-------|
| Primary | Main actions |
| Secondary | Secondary actions |
| Outline | Tertiary actions |
| Ghost | Minimal emphasis |
| Destructive | Destructive actions |

**Sizes:**
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | `{32px}` | `{12px 16px}` | `{14px}` |
| md | `{40px}` | `{16px 24px}` | `{16px}` |
| lg | `{48px}` | `{20px 32px}` | `{18px}` |

**States:** default, hover, active, disabled, loading

---

### Input

**Variants:**
| Variant | Usage |
|---------|-------|
| Default | Standard input |
| Error | Validation error |
| Disabled | Non-interactive |

**Sizes:** sm, md, lg (same as Button)

---

### Card

```
┌─────────────────────────────┐
│ Header (optional)           │
├─────────────────────────────┤
│                             │
│ Content                     │
│                             │
├─────────────────────────────┤
│ Footer (optional)           │
└─────────────────────────────┘
```

**Props:**
- `variant`: elevated | outlined | filled
- `padding`: none | sm | md | lg

---

### Modal

```
┌─────────────────────────────┐
│ Title                    ✕ │
├─────────────────────────────┤
│                             │
│ Content                     │
│                             │
├─────────────────────────────┤
│            Cancel | Confirm │
└─────────────────────────────┘
```

**Sizes:** sm (400px) | md (600px) | lg (800px) | full

---

### Toast / Notification

**Types:** success | warning | error | info
**Position:** top-right | top-center | bottom-right | bottom-center
**Duration:** {default ms}

---

## Icons

**Icon Library:** {library name}
**Size Scale:** 16px | 20px | 24px | 32px

### Common Icons
| Name | Usage |
|------|-------|
| {icon} | {usage} |
| {icon} | {usage} |

---

## Motion / Animation

### Duration Scale
| Token | Duration | Usage |
|-------|----------|-------|
| instant | `0ms` | No animation |
| fast | `100ms` | Micro-interactions |
| normal | `200ms` | Default transitions |
| slow | `300ms` | Larger elements |

### Easing
| Token | Curve | Usage |
|-------|-------|-------|
| ease-out | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| ease-in | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Move animations |

### Reduced Motion
All animations must respect `prefers-reduced-motion`.

---

## Accessibility

### Focus Indicators
- Visible focus ring on all interactive elements
- Focus ring color: `{color}`
- Focus ring width: `{size}`

### Color Contrast
- Text on background: minimum 4.5:1
- Large text: minimum 3:1
- UI components: minimum 3:1

### Screen Reader
- All images have alt text
- All icons have aria-labels
- Form fields have labels
- Error messages are announced

---

## Dark Mode

| Token | Light | Dark |
|-------|-------|------|
| Background | `{#hex}` | `{#hex}` |
| Surface | `{#hex}` | `{#hex}` |
| Text Primary | `{#hex}` | `{#hex}` |
| Text Secondary | `{#hex}` | `{#hex}` |
| Border | `{#hex}` | `{#hex}` |

---

## Implementation

### Token Files
```
packages/design-tokens/
├── colors.ts
├── typography.ts
├── spacing.ts
├── breakpoints.ts
└── index.ts
```

### Component Library
```
packages/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── Input/
├── Card/
└── ...
```

---

## Usage Examples

### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Submit
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  error={errors.email}
  placeholder="you@example.com"
/>
```

---

## Figma / Design Files

{Link to Figma or design files if available}
