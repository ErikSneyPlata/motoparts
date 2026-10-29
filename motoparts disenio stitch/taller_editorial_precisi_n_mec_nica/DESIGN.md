---
name: Taller Editorial & Precisión Mecánica
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#e2bfb2'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#a98a7e'
  outline-variant: '#5a4137'
  surface-tint: '#ffb596'
  primary: '#ffb596'
  on-primary: '#581e00'
  primary-container: '#ff6b1a'
  on-primary-container: '#591e00'
  inverse-primary: '#a43e00'
  secondary: '#ffb780'
  on-secondary: '#4e2600'
  secondary-container: '#a05401'
  on-secondary-container: '#ffe3d1'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00af79'
  on-tertiary-container: '#003a25'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcd'
  primary-fixed-dim: '#ffb596'
  on-primary-fixed: '#360f00'
  on-primary-fixed-variant: '#7d2d00'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#ffb780'
  on-secondary-fixed: '#2f1400'
  on-secondary-fixed-variant: '#6f3800'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Syne
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system defines an authoritative, dark-editorial interface engineered for high-performance motorcycle workshops and spare parts supply operations across Colombia. It merges the mechanical precision of technical workshop manuals with an editorial aesthetic: moody high-contrast surfaces, meticulous typography, and tactile data density.

### Aesthetic Principles
- **Mechanical Precision meets Editorial Elegance:** Technical inventory metrics, part serials, and diagnostic logs sit beside striking display typography, transforming utilitarian workshop management into a distinguished operational cockpit.
- **Shop-Floor Legibility:** High-contrast off-white text over deep obsidian surfaces ensures legibility under fluorescent garage tubes, direct workshop sunlight, or low-light service bays.
- **Grease-Resistant Ergonomics:** Touch targets, quick-scan status indicators, and prominent input surfaces are calibrated for rapid interaction on mobile and ruggedized tablets without accidental inputs.
- **Localization & Operational Culture:** Tone, terminology, and visual constructs are tailored to the Colombian motorcycling market (referencing SOAT validations, RUNT-aligned VIN records, DIAN-compatible invoice workflows, and Colombian Peso currency hierarchies).

## Colors

The palette establishes an industrial darkness punctuated by high-visibility functional signals.

### Core Architecture
- **Base Canvas (`#0B0B0D`):** The foundational substrate. Deep near-black mitigating glare and eye fatigue during prolonged workshop shifts.
- **Default Surface (`#141417`):** Base container fill for inventory cards, workshop order lists, and docked panels.
- **Elevated Surface (`#1C1C21`):** Floating dialogs, elevated drawers, active table row highlights, and active inspection tabs.
- **Structural Outlines:** Subtle hairline borders in `#2A2A30` define visual structure without visual clutter; interactive hover transitions elevate borders to `#3A3A42`.

### Brand Accents
- **Primary Brand Accent (`#FF6B1A`):** Pure amber-orange used for core calls-to-action, active mechanic bay badges, and vital state switches.
- **Secondary Accent (`#E58A3C`):** Warm copper/gold reserved for technical metadata, VIP commercial accounts, and high-tier OEM component indicators.

### Diagnostic & Status Logic
- **Stock Disponible / Óptimo (`#10B981`):** Emerald green for verified inventory, cleared inspection points, and paid service orders.
- **Stock Bajo / En Alerta (`#F59E0B`):** Amber yellow for inventory at reorder threshold and pending authorizations.
- **Agotado / Crítico (`#EF4444`):** Crimson red for backordered references, failed diagnostic checks, and overdue workshop dispatches.
- **En Proceso / Info (`#3B82F6`):** Sapphire blue for vehicles currently on hydraulic lifts, diagnostics running, and warranty queries.

### Typographic Contrast
- **Text Primary (`#F3F4F6`):** Off-white providing contrast for part references and diagnostics.
- **Text Secondary (`#9CA3AF`):** Muted cool gray for subheadings, category tags, and timestamps.
- **Text Subtle (`#6B7280`):** Dimmed gray for disabled actions, passive guide markers, and table footer tallies.

## Typography

The typographic hierarchy employs three specialized typefaces to serve clear functional roles:

1. **Editorial Display (`Syne`):** Imparts an assertive, custom-built mechanical voice to dashboard titles, operational summaries, and major metric categories.
2. **Interface & Ergonomics (`Plus Jakarta Sans`):** Clean geometric construction with high x-height ensuring crisp readability in dense inventory tables and technician notes.
3. **Telemetry & Part Monospace (`JetBrains Mono`):** Strict tabular figures for Colombian Peso (`$ COP`) values, VIN identifiers, barcode alphanumeric codes, OEM numbers, and shelf bin coordinates (`BOD-02-EST-04`).

### Localization Rules
- Currency amounts must consistently render using `code-md` or `code-lg` with standard Colombian punctuation (points for thousands: `$ 1.450.000 COP`).
- Vehicle license plates (e.g., `ABC-12D`) and engine serial numbers must always render uppercase in monospace styles.

## Layout & Spacing

The layout is built upon an 8pt base grid supporting an asymmetric desktop architecture and a single-column layout on mobile devices.

### Desktop Layout Model
- **Fixed Sidebar Navigation:** A permanent 280px technical sidebar on the left containing fast-access workshop bays, spare parts catalog trees, invoice dispatchers, and hardware barcode listeners.
- **Fluid Work Desk:** The remaining viewport width adapts via a 12-column responsive grid with `1.25rem` (20px) gutters. Complex tables (inventories, batch orders) span the full canvas; operational dashboards split 8-columns (current bay lift queues) and 4-columns (real-time parts ledger).

### Mobile & Workshop Tablet Architecture
- **Breakpoints:**
  - `Desktop`: ≥ 1024px
  - `Tablet`: 640px – 1023px (Sidebar collapses to an icon-only 64px rail)
  - `Mobile`: < 640px (Sidebar collapses to a bottom docked utility bar)
- **Shop-Floor Hit Targets:** All interactive triggers on mobile and tablet scale up to an absolute minimum dimension of 48px × 48px to accommodate interactions in active workshop conditions.

## Elevation & Depth

Visual hierarchy uses sharp surface-container layering and 1px mechanical perimeter borders rather than heavy ambient drop shadows.

### Tonal Tiers
- **Tier 0 (Substrate Canvas):** `#0B0B0D` – Viewport foundation.
- **Tier 1 (Surface Containers):** `#141417` with a structural `1px solid #2A2A30` border. Applied to data tables, order summary panels, and inventory manifests.
- **Tier 2 (Floating & Interactive Panels):** `#1C1C21` with `1px solid #3A3A42`. Applied to flyouts, filter drawers, scan confirmation dialogs, and barcode popovers.

### Focused Shadows & Illumination
- Traditional drop shadows are replaced with subtle amber edge glows for critical focus states.
- **Active Focus Glow:** `0 0 0 2px #0B0B0D, 0 0 12px rgba(255, 107, 26, 0.35)` to direct the mechanic’s focus when scanning parts or adjusting repair order quantities.
- **Modal Depth:** Deep modal backdrops use `rgba(11, 11, 13, 0.85)` with a `backdrop-filter: blur(8px)` treatment to maintain context behind technical documentation.

## Shapes

The interface adopts a sharp industrial curvature (`roundedness: 1`), conveying technical reliability and functional precision.

### Application Logic
- **Cards, Modals & Data Tables:** Standard container corners feature `0.25rem` (4px) to `0.5rem` (8px) corner radii.
- **Form Controls & Hardware Inputs:** Field inputs, dropdown selectors, and quantity steppers strictly use `0.25rem` (4px).
- **Status Chips & Barcode Tags:** Exceptionally, diagnostic badges and stock state chips utilize pill geometry (`9999px`) to contrast against the rectangular structural grid.
- **Barcode & QR Target Frames:** Hard 0px corners with corner tick marks (`L-shaped` framing) to evoke optical targeting instrumentation.

## Components

### Buttons & Action Controls
- **Primary Industrial:** Amber Orange fill (`#FF6B1A`), crisp off-white bold text (`#F3F4F6`), 4px border radius. Hover: `#E55A0F`. Focus ring: 2px primary glow. Minimum height: 44px (48px on mobile).
- **Secondary Mechanical:** Surface fill (`#141417`), 1px outline (`#2A2A30`), text `#F3F4F6`. Hover: Border elevates to `#3A3A42`, background to `#1C1C21`.
- **Destructive Action:** Low-saturation red surface (`rgba(239, 68, 68, 0.12)`), crimson border (`#EF4444`), text `#EF4444`. Used for canceling work orders or voiding invoices.

### Status Indicators & Chips
- **Pill Badges:** Height 24px, pill-shaped (`border-radius: 9999px`), internal horizontal padding `0.75rem`.
  - *Disponible:* `#10B981` at 15% opacity, text `#10B981`, 1px border `rgba(16, 185, 129, 0.3)`.
  - *Agotado:* `#EF4444` at 15% opacity, text `#EF4444`, 1px border `rgba(239, 68, 68, 0.3)`.
  - *En Bahía:* `#3B82F6` at 15% opacity, text `#3B82F6`, 1px border `rgba(59, 130, 246, 0.3)`.

### Technical Data Tables
- Header row: Surface `#141417`, border-bottom `2px solid #2A2A30`, text in uppercase `label-sm` (`#9CA3AF`).
- Body row: Background alternate (`#0B0B0D` / `#141417`), hover background `#1C1C21`.
- Cell alignment: Monospace serials, SKUs, and Colombian Peso totals right-aligned with tabular numbers; descriptions and vehicle compatibilities left-aligned.

### Input Fields & Search Bars
- Background `#141417`, border `1px solid #2A2A30`, text `#F3F4F6`.
- Leading icons for barcode reader hooks, part categorization, and plate lookups.
- Floating label or top-locked label in `label-sm` (`#9CA3AF`). Active state transitions border to `#FF6B1A`.

### Specialized Domain Components
- **Part Barcode Tag:** Container with dotted 1px border (`#3A3A42`), embedded SVG barcode with legible human-readable code underneath in `code-sm`.
- **Motorcycle Bay Status Card:** Visual bay indicator (e.g., "BAHÍA 03 - ELEVADOR"), technician avatar, active plate badge (`ABC-12D`), diagnostic progress bar, and instant action button ("Finalizar Orden").
- **COP Currency Metric:** Compound component pairing small currency symbol (`$`), prominent tabular monospace digits, and diminutive trailing `COP` indicator.