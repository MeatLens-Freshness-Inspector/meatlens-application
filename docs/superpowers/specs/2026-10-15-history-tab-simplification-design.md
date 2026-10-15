# History Tab Simplification Design

**Date:** 2026-10-15
**Status:** Approved for implementation

## Goal

Make the inspector History tab fast and understandable for meat inspectors who are comfortable using a phone but are not technical users. The primary task is finding and opening a saved inspection; reporting and analytics remain available without competing with that task.

## Scope

### In scope

- Reframe the History page around a plain-language saved-record list.
- Make the action on each record explicit: **Open record**.
- Replace the dense filter surface with one simple search field and a plain-language status filter. Keep the existing classification values available from that filter.
- Keep date filtering, PDF export, and analytics in an always-visible report and totals area below the primary list.
- Make PDF behavior explicit:
  - no date selected: export all saved inspections;
  - date selected: export only inspections from that day;
  - empty states and helper text must tell the user which scope will be exported.
- Keep existing pagination, date filtering, classification filtering, PDF generation, record details, and dispute submission behavior working.
- Simplify the top of the inspection detail view so the saved result, confidence, location, and dispute action are easy to find while retaining the full detail content below.
- Update the History tutorial to demonstrate the simplified list, explicit open action, review view, and return action.

### Out of scope

- No backend API changes.
- No database schema, migration, or persistence changes.
- No change to report contents or dispute workflow semantics.
- No removal of stored inspection fields or analytics calculations.

## User flow

1. The inspector opens History and immediately sees **Saved inspections** with a short explanation that tapping **Open record** shows the saved result.
2. The inspector can type a meat type or place into **Find a record by meat or place**.
3. The inspector can choose **All results**, **Fresh**, **Not fresh**, **Acceptable**, **Warning**, or **Spoiled** from one compact status control.
4. The inspector taps **Open record** on a record card.
5. The detail view leads with the classification, confidence, date/location, and **Dispute result** action. Technical metadata, protocol information, analysis, deviations, and notes remain below for review.
6. The inspector closes the detail view to return to the list.
7. If reporting is needed, the inspector scrolls to **Export a report**. The section says whether export is for **all saved inspections** or **inspections from [date]**. The export button uses the matching scope.

## UI design

### History list

- Use a single-column, mobile-first layout for the primary record list.
- Replace the four metric cards at the top with one compact page header and total-count summary.
- Use plain labels and sentence case. Avoid leading with terms such as “timeline insights,” “classification mix,” or “average confidence.”
- Keep the record card’s useful recognition cues: sample image/placeholder, meat type, date/time, location, classification, and confidence.
- Add a prominent, accessible **Open record** button to each record. Clicking the card may remain a convenience, but the button is the documented action and must not be nested inside another interactive element.
- Preserve clear loading, no-results, and pagination states.

### Report and totals area

- Keep report export and inspection totals visible without requiring the inspector to open a hidden menu.
- Label the report section **Export a report** and explain that no date means all saved inspections.
- Date filter remains optional and clearable.
- Export helper text is always visible and changes with the selected date.
- Analytics keep their existing values and calculations but are secondary to record lookup.

### Detail view

- Keep the existing modal/sheet and all existing information.
- Make the result summary visually first and use plain labels such as **Result**, **Confidence**, **When**, and **Where**.
- Keep **Dispute result** visible without requiring the user to find it after reading every technical section.

### Tutorial

- Use the same fixture data as the live flow.
- Teach: open a saved record, review the result and dispute action, then return to the list.
- Show the new search/filter/report controls only as secondary tools when they are relevant; do not make the tutorial require navigating the analytics panels or opening a collapsed menu.

## Data and behavior

- `useHistory` continues to own filtering, pagination, selection, and report export state.
- When no date is selected, the report input uses all loaded inspections and the filename uses an all-records scope.
- When a date is selected, the report input uses `selectedDayInspections` and keeps the existing date-specific filename.
- Model accuracy history remains date-scoped when a date is selected. For an all-record export, the report receives the available overall model accuracy history without introducing a new backend request contract.
- Existing direct navigation with `{ inspectionId }` continues to open the matching detail view.

## Accessibility and language

- Use real buttons for all actions and explicit labels for search, status, date, and export controls.
- Preserve keyboard focus behavior for the detail dialog.
- Use minimum touch targets consistent with the existing shared button system.
- Avoid unexplained jargon in primary labels; technical details may remain in the expanded detail content.

## Verification

- Add or update unit tests for all-record and date-scoped export selection.
- Add component tests for the simplified History list, explicit **Open record** action, and visible export-scope copy.
- Update tutorial component tests for the new History steps and labels.
- Run targeted frontend unit/component tests, then frontend typecheck, lint, and build.
- Do not change backend or database tests because the implementation is frontend-only.
