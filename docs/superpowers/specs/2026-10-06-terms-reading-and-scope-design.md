# Terms Reading Gate and Scope Clarification

## Goal

Require new users to open the MeatLens Terms and Conditions and scroll to the bottom before the terms acknowledgement checkbox can be selected. Clarify the product boundaries consistently in the full terms content and the scope reference page.

## User flow

1. The terms acknowledgement checkbox starts disabled.
2. The user opens the Terms and Conditions dialog.
3. The user scrolls the dialog content to the bottom.
4. The dialog reports completion to the signup workflow and the checkbox becomes enabled.
5. The user checks the terms acknowledgement and separately accepts the privacy policy before submitting.

Reaching the bottom persists for the current signup form if the dialog is closed and reopened. Closing the dialog before reaching the bottom does not unlock the checkbox. Form validation remains authoritative in case the UI is bypassed.

## Design

`TermsAndConditionsDialog` will own detection of the scroll container reaching its bottom and expose completion through a callback. `useSignupPage` will own the `termsReadToEnd` state and provide it to the signup view. The signup view will disable the terms checkbox until completion, use wording that states the user has read the terms, and display a short instruction while the gate is incomplete.

The privacy-policy flow is unchanged. Terms acknowledgement and privacy acceptance remain separate required fields.

## Scope and delimitations

The canonical scope wording in `terms-content.tsx` and `scope-reference.ts` will state that MeatLens is an AI-assisted pork freshness screening tool. Its supported output is limited to `Fresh`, `Not Fresh`, and `Spoiled` classifications.

The wording will explicitly exclude detection or diagnosis of sick meat, disease, illness, pathogens, contamination, parasites, chemical adulteration, and other non-visible or non-freshness health conditions. MeatLens is not a microbiological or chemical laboratory test, veterinary or medical diagnostic tool, certification authority, or standalone basis for enforcement or public-health decisions. Non-pork samples are outside the supported validated scope, and official procedures and professional judgment remain authoritative.

The terms and scope reference will use matching concepts and vocabulary so the signup disclosure and in-app help page do not imply different capabilities.

## Testing

- Unit-test the signup validation/state behavior for the terms gate.
- Component-test that the checkbox is disabled before the dialog reaches the bottom and enabled afterward.
- Test scroll completion at the dialog boundary, including content that is already non-scrollable.
- Update legal-content tests to assert the explicit sick-meat and unsupported-condition limitations in both sources.
- Run the affected frontend unit/component tests, then frontend lint, typecheck, architecture checks, and the frontend build as the relevant CI gates.
