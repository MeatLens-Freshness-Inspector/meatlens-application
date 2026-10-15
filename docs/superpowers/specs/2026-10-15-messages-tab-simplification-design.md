# Messages Tab Simplification Design

**Date:** 2026-10-15  
**Status:** Approved for implementation

## Goal

Make Messages immediately understandable for meat inspectors who are comfortable using a phone but are not technical users. The primary task is choosing a person and sending or reading a support message.

## Scope

### In scope

- Replace the dashboard-like date header and four statistic cards with a short task-first Messages header.
- Rename the contact area to **People you can message** and use plain-language search and refresh controls.
- Make contact cards read as actions with a clear **Message** affordance while preserving the current contact roles and selection behavior.
- Rename the conversation area to **Chat with [person]** and simplify connection status wording.
- Keep the existing desktop split view and mobile contacts-to-chat flow.
- Update the Messages tutorial to demonstrate finding a person, opening a chat, and sending the first message.

### Out of scope

- No backend API, database, authentication, contact-permission, or message-delivery changes.
- No change to online-only behavior.
- No removal of contact search, refresh, reconnect, message history, timestamps, or loading/error states.

## User flow

1. The inspector opens Messages and sees a short instruction to choose someone to message.
2. The inspector searches **People you can message** using a name.
3. The inspector taps a contact card or its **Message** action.
4. The chat heading identifies the selected person directly: **Chat with [person]**.
5. The inspector reads the conversation or types a message in the clearly labeled message box and taps **Send**.
6. If the connection is unavailable, the page says **Offline** and keeps the existing reconnect action.

## UI design

### Page header

- Keep the Messages icon and title.
- Use a short supporting sentence: **Choose someone to message.**
- Remove the current month pill and contact-statistic cards from the primary view.

### Contact list

- Heading: **People you can message**.
- Search placeholder: **Find a person by name**.
- Use a labeled **Refresh contacts** button instead of an icon-only refresh action.
- Keep role labels, last-message preview, and last activity as supporting context.
- Add a visible **Message** label to each selectable contact card without nesting a button inside the card button.

### Chat

- Heading: **Chat with [person]** when a person is selected; retain a plain empty prompt when no person is selected.
- Use concise status labels: **Connected**, **Connecting**, and **Offline**.
- Keep the message composer and **Send** action prominent and touch-friendly.

## Tutorial

- The Messages tutorial must use the same plain labels as the live tab.
- Its first scene teaches finding a person and tapping **Message**.
- Its second scene teaches reading the chat and sending the first message.
- Connection status remains visible as supporting information, not the primary task.

## Data and behavior

- `useMessages` remains the owner of contact loading, selection, filtering, mobile panel state, message loading, sending, and stream reconnect behavior.
- Existing admin/user contact visibility remains unchanged.
- The UI continues to require an authenticated online session for messaging.

## Verification

- Add or update component tests for the simplified header, contact controls, and chat labels.
- Update Messages tutorial tests for the new labels and send action.
- Run targeted Messages/tutorial tests, frontend typecheck, lint, and production build.
