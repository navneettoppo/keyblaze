# Design System Inspired by Superhuman

## 1. Visual Theme & Atmosphere

Premium dark UI, keyboard-first, purple glow. Deep purple gradient hero (`#1b1938`) with lavender accent (`#cbb7fb`). Maximum confidence through minimum decoration.

## 2. Color Palette

- **Background**: `#0d0d0d` — near-black canvas
- **Hero Gradient**: `#1b1938` — deep twilight purple
- **Accent**: `#cbb7fb` — lavender glow (selected key highlight, CPM display)
- **Primary Text**: `#ffffff` / `color(srgb 1 1 1 / 0.95)`
- **Secondary Text**: `color(srgb 1 1 1 / 0.6)`
- **Surface**: `#1a1a2e` — dark purple-tinted card surface
- **Border**: `rgba(203, 183, 251, 0.15)` — subtle lavender border

### Finger Color Mapping (keyboard keys)
- **Pinky**: `#3d1a4a` bg, `#9b59b6` border
- **Ring**: `#2d1a3d` bg, `#8e44ad` border
- **Middle**: `#251535` bg, `#7d3c98` border
- **Pointer 1st**: `#1e1030` bg, `#6c3483` border
- **Pointer 2nd**: `#180c28` bg, `#5b2c6f` border
- **Selected key**: transparent bg, `#cbb7fb` border + glow

## 3. Typography

- **Font**: `system-ui, -apple-system, "Segoe UI", sans-serif`
- **Title**: 11px, weight 700, letter-spacing 0.3em, uppercase, `color(srgb 1 1 1 / 0.5)`
- **CPM Display**: 48px, weight 300, `#cbb7fb`
- **Key labels**: 12px, weight 600, letter-spacing 1px

## 4. Component Stylings

### Keys
- Default: dark purple-tinted background, matching border, key label in `rgba(255,255,255,0.7)`
- Selected: transparent background, `#cbb7fb` border, lavender glow (`box-shadow: 0 0 12px #cbb7fb`), vibrate animation
- Hit: scale-up animation, brief lavender flash

### CPM Counter
- Displayed on screen (not just console)
- Large lavender number, small uppercase label below
- Positioned between keyboard and bottom title

### Layout
- Full viewport height, flex column, centered
- Deep purple gradient background
- 8px border-radius on keys, no pill shapes
