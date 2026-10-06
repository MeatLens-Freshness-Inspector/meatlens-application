# Regulatory Compliance Radio Controls

## Context

The inspection pre-scan currently presents the three regulatory compliance questions as native Yes/No select controls:

- Storage Correct
- Light Color Correct
- Area Clean

Meat inspectors need a control that is quick to identify and forgiving to click on a touch device or desktop monitor. The existing pre-scan form state, validation, protocol-failure behavior, and conditional observed-light-color field must remain unchanged.

## Interaction design

Replace each native select with an accessible Yes/No radio group.

Each question remains inside its existing form-field slot so it continues to fit the current pre-scan grid. The two choices are large, card-like, fully clickable options:

- Desktop/tablet: one row with two evenly sized columns, Yes and No.
- Mobile: two rows with one full-width option per row.

The complete option surface, including its text and radio indicator, activates the choice. Each option has a generous minimum height and spacing, a visible focus state, a clear selected state, and a disabled state matching the existing locked/bypassed behavior.

The radio groups retain clear accessible names for the three questions, and each radio option has a stable accessible label so automated tests and assistive technology can distinguish, for example, “Storage Correct: Yes” from the other Yes choices.

## Behavior and data flow

- The selected values remain the existing `"" | "yes" | "no"` values in `InspectionPreScanForm`.
- Changing an option calls the existing `onFieldChange` callback with the same field key and value.
- The existing completion rules still require an answer for all three questions.
- The existing protocol-failure rule still treats any `"no"` answer as a failed pre-scan.
- The existing “What Color?” field remains conditional on `lightColorCorrect === "no"`.
- Existing lock and bypass states disable the radio groups without changing stored values.

## Verification

Add component coverage for the three radio groups and their six options. Update affected Playwright helpers/specs to select the new radio options through their accessible names, then run the relevant frontend lint, typecheck, component/unit, architecture, E2E, and build checks required by the repository CI workflow.

## Alternatives considered

1. Keep native selects and enlarge their styling. This preserves the current interaction but still hides the two possible answers behind a dropdown and is slower for repeated inspections.
2. Use small standalone radio circles beside text. This is semantically correct but leaves inspectors with a smaller target than necessary.
3. Use large clickable radio cards with responsive layout. This keeps the existing data contract while making the full answer area easy to hit, so this is the selected approach.
