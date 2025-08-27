# UI Guidelines

Portable, mobile-first patterns and a dark theme baseline.

## Philosophy
- Primary target: mobile; desktop enhances mobile.
- Accessibility: keyboard and screen reader friendly.
- Performance: minimize work per interaction; perceived speed matters.

## Visual Design
- Dark theme palette:
  - Content background: #1E2128
  - Card background: #252831 with #343741 border
  - Text: #FFFFFF
  - Link: #4693D1
  - Primary: #1878B9
  - Success: #469B3B
- Spacing: 8px grid; consistent paddings and gaps.
- Card layout: related fields grouped; consistent section headers.

## Interaction
- Touch targets ≥ 48px height.
- Immediate visual feedback on interactions.
- Clear loading states for async work.
- Inline error messages near fields; summary at step boundary when relevant.

## Multi-step Wizard
- Reduce cognitive load for complex forms.
- Progress indicator with step titles; back navigation always available.
- Block next step until validation passes.

## Responsive Behavior
- Collapsible navigation on small screens.
- Gesture support where appropriate; manage focus correctly.
