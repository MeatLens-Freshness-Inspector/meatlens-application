# History Progressive Disclosure Design

## Goal

Make the inspector-facing History tab fast to understand for non-technical field users while preserving record lookup, documentation-photo access, PDF export, offline history, and the existing administrator dashboard.

## Audience and design direction

History is used by inspectors who may be uncomfortable with dense interfaces and may be working quickly in a market. The default screen should answer three questions immediately:

1. Where do I find a saved record?
2. How do I open the record?
3. How do I export the report?

Secondary filters, documentation-photo cards, and summary charts remain available through plainly labeled controls but do not occupy the first view.

## Interaction design

### Saved inspections

- Keep the search field visible by default with the label **Find a saved record**.
- Keep the saved-record count visible.
- Collapse the status filter by default behind **Filter results**.
- When expanded, retain the existing **Show results** select and all classification options.
- Preserve the existing record card, image enlargement, stall/location data, result, and **Open record** action.

### Documentation photos

- Keep the documentation-photo section in its current position.
- Show only its heading, count, and a clear **Show documentation photos** button by default when entries exist.
- Render the existing cards and **View details** interactions only after expansion.
- Preserve pending/offline photo entries, stall numbers, details, and photo enlargement.

### PDF export

- Keep the export section visible without an extra menu.
- Keep the date field optional and explain the default behavior in plain language.
- With no date selected, use **Export all inspections as PDF** and explain that all saved inspections are included.
- With a date selected, use the existing single-day export label and count message.

### Summary information

- Collapse classification totals and monthly activity by default behind **Show totals and trends**.
- Keep the existing `HistorySidebar` content and calculations unchanged when expanded.

## Architecture and data flow

- Keep `useHistory` and all export/filter calculations unchanged unless a UI state prop is required.
- Store filter, documentation, and summary disclosure state locally in their respective UI components; disclosure state must not affect query, pagination, export scope, or offline cache behavior.
- Do not change backend routes, database schemas, inspection payloads, documentation-photo payloads, or PDF generation.
- Update the history tutorial mock and instructional copy to mirror the collapsed default states and the visible export behavior.

## Accessibility and mobile behavior

- Use native buttons with `aria-expanded` and `aria-controls` for every disclosure.
- Use visible labels for the primary search field and export controls.
- Keep controls touch-friendly at 300-350px viewport widths.
- Do not hide the main record-opening action inside an unlabeled menu.

## Verification criteria

- Component tests prove the status filter, documentation cards, and summary panels are collapsed by default and expose clear disclosure labels.
- Existing record-card, documentation-card narrow-width, offline-history, and export behavior tests remain green.
- Tutorial component tests prove the tutorial no longer presents the old dense default state.
- A focused Playwright journey verifies the default History viewport, opening filters/photos/totals, opening a record, and exporting with no selected date.
- No backend or database files are changed.
