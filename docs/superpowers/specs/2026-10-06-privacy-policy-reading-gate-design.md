# Privacy Policy Reading Gate Design

## Goal

Require new users to open the MeatLens Privacy Policy and scroll through its full content before the privacy acknowledgement checkbox can be selected, matching the existing Terms and Conditions requirement.

## Behavior

- The privacy acknowledgement checkbox is disabled until the Privacy Policy dialog's scroll container reaches the bottom.
- Opening the dialog alone is not sufficient; the user must reach the content boundary.
- Once the bottom is reached, the signup page records that the policy was read through the end and enables the checkbox.
- The existing privacy acceptance validation remains in place, and signup submission additionally rejects any state where the policy has not been read through the end.
- Existing Terms and Conditions gating, dialog behavior, and privacy policy content remain unchanged.

## Implementation

- Extend `PrivacyPolicyDialog` with an optional `onReadToEnd` callback and the same scroll-bottom predicate used by the Terms dialog.
- Add `privacyReadToEnd` state and a handler in the signup model/hook, pass it through `SignupPageView`, disable the privacy checkbox until it is true, and show concise guidance while locked.
- Add a unit test for the validation boundary and extend the signup E2E flow to prove the privacy checkbox is initially disabled, becomes enabled only after scrolling to the bottom, and is required before account creation.

## Error handling and accessibility

- Keep the existing validation error copy for an unchecked Privacy Policy acknowledgement.
- Use the native checkbox disabled state and the existing dialog scroll container so keyboard and screen-reader behavior remain consistent.
- Do not alter the signup payload or backend contract.

## Verification

- Run the focused signup validation/unit tests and the terms-and-conditions E2E suite.
- Run the frontend typecheck, lint, relevant component/integration tests, and the full root test gate before completion.
