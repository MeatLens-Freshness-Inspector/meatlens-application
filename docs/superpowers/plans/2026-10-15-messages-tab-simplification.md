# Messages Tab Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Make Messages a plain-language, phone-first path for choosing a contact and sending or reading a support message.

**Architecture:** Keep \`useMessages\` and \`useMessagesModel\` unchanged as the owners of contact loading, filtering, selection, mobile panel state, message history, sending, and reconnect behavior. Simplify the existing \`MessagesHeader\`, \`ContactsPanel\`, and \`ThreadPanel\` presentation components, then align the simulated Messages tutorial with the same labels and actions.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, shared UI components, Node test runner through \`tsx\`, Vite.

## Global Constraints

- No backend API, database, authentication, contact-permission, or message-delivery changes.
- No change to online-only behavior.
- Keep desktop split view and mobile contacts-to-chat flow.
- Preserve contact search, refresh, reconnect, message history, timestamps, loading, and error states.
- Use plain labels: \`Choose someone to message.\`, \`People you can message\`, \`Find a person by name\`, \`Refresh contacts\`, \`Message\`, \`Chat with [person]\`, \`Connected\`, \`Connecting\`, and \`Offline\`.

---

### Task 1: Make the Messages header and contact list task-first

**Files:**
- Modify: \`frontend/src/widgets/messages/messages-header.tsx\`
- Modify: \`frontend/src/widgets/messages/contacts-panel.tsx\`
- Modify: \`frontend/src/pages/inspector/messages-page.tsx\`
- Create: \`frontend/tests/component/messages/messages-header.component.test.tsx\`
- Create: \`frontend/tests/component/messages/contacts-panel.component.test.tsx\`

**Interfaces:**
- \`MessagesHeader\` becomes a no-prop presentation component; \`MessagesPage\` renders it as \`<MessagesHeader />\` when the contacts panel is visible.
- \`ContactsPanel\` keeps its current props and selection callback. Its contact card remains one accessible button, with a visible \`Message\` label inside that same button rather than a nested action button.

- [ ] **Step 1: Write the failing header and contact tests**

Create the header test with \`renderToStaticMarkup\` and assert \`Messages\`, \`Choose someone to message.\`, and the absence of \`Total Contacts\`, \`Admin Contacts\`, \`User Contacts\`, \`Latest Activity\`, and the current month.

Create the contact test with one admin contact and callbacks. Assert:
- \`People you can message\`
- \`Find a person by name\`
- \`aria-label="Refresh contacts"\`
- visible \`Refresh contacts\`
- visible \`Message\`
- absence of \`Contact Directory\` and \`Search by name, email, code\`

- [ ] **Step 2: Run the focused tests and verify RED**

Run from \`frontend\`:

~~~powershell
npm exec -- tsx --test tests/component/messages/messages-header.component.test.tsx tests/component/messages/contacts-panel.component.test.tsx
~~~

Expected: FAIL because the existing header still requires dashboard props and the existing contact labels are unchanged.

- [ ] **Step 3: Implement the task-first header and contacts**

In \`messages-header.tsx\`, remove \`date-fns\`, \`CalendarDays\`, the four statistic props, and the statistic grid. Keep the Messages icon and render the title with the exact supporting sentence \`Choose someone to message.\`.

In \`messages-page.tsx\`, replace the prop-heavy header call with:

~~~tsx
<MessagesHeader />
~~~

In \`contacts-panel.tsx\`:
- Change \`Contact Directory\` to \`People you can message\`.
- Change the count pill to \`N person\` or \`N people\`.
- Change the input placeholder and accessible label to \`Find a person by name\`.
- Replace the icon-only refresh button with a text button containing the icon and \`Refresh contacts\`.
- Add a visible \`Message\` label to each contact card while keeping the card as the only button.

- [ ] **Step 4: Run the focused tests and verify GREEN**

~~~powershell
npm exec -- tsx --test tests/component/messages/messages-header.component.test.tsx tests/component/messages/contacts-panel.component.test.tsx
~~~

Expected: PASS.

- [ ] **Step 5: Commit the header/contact simplification**

~~~powershell
git add frontend/src/widgets/messages/messages-header.tsx frontend/src/widgets/messages/contacts-panel.tsx frontend/src/pages/inspector/messages-page.tsx frontend/tests/component/messages/messages-header.component.test.tsx frontend/tests/component/messages/contacts-panel.component.test.tsx
git commit -m "feat: simplify messages contact entry point"
~~~

### Task 2: Make the chat panel plain and direct

**Files:**
- Modify: \`frontend/src/widgets/messages/thread-panel.tsx\`
- Modify: \`frontend/tests/component/messages/thread-panel.component.test.tsx\`

**Interfaces:**
- \`ThreadPanel\` keeps its current props and callbacks. Only presentation copy and accessible labels change.

- [ ] **Step 1: Write failing chat-label assertions**

Extend the existing component tests with a selected contact and assert:
- \`Chat with Chat Contact\`
- \`Connected\`
- \`aria-label="Type your message"\`
- \`Type your message\`
- absence of \`Conversation Thread\` and \`Live updates connected\`

Update the existing disconnected and connected assertions to expect \`Offline\`, \`Connecting\`, and \`Connected\` as applicable.

- [ ] **Step 2: Run the focused test and verify RED**

~~~powershell
npm exec -- tsx --test tests/component/messages/thread-panel.component.test.tsx
~~~

Expected: FAIL because the current panel says \`Conversation Thread\`, \`Live updates connected\`, and uses the contact-name placeholder.

- [ ] **Step 3: Implement direct chat copy**

In \`thread-panel.tsx\`:
- Map stream states to \`Connected\`, \`Connecting\`, and \`Offline\`.
- Render \`Chat with [selected person]\` when selected and \`Choose someone to message\` when empty.
- Change the composer placeholder and \`aria-label\` to \`Type your message\` when a contact is selected; keep the disabled state when none is selected.
- Keep the existing reconnect button and message list behavior unchanged.

- [ ] **Step 4: Run the focused test and verify GREEN**

~~~powershell
npm exec -- tsx --test tests/component/messages/thread-panel.component.test.tsx
~~~

Expected: PASS.

- [ ] **Step 5: Commit the chat simplification**

~~~powershell
git add frontend/src/widgets/messages/thread-panel.tsx frontend/tests/component/messages/thread-panel.component.test.tsx
git commit -m "feat: simplify messages chat panel"
~~~

### Task 3: Align the Messages tutorial with the live flow

**Files:**
- Modify: \`frontend/src/features/tutorials/model/inspection-tutorial.ts\`
- Modify: \`frontend/src/features/tutorials/ui/scenes/messages-mock-scene.tsx\`
- Modify: \`frontend/tests/component/tutorials/messages-mock-scene.component.test.tsx\`
- Modify: \`frontend/tests/unit/features/tutorials/tutorial-model.unit.test.ts\`

**Interfaces:**
- Keep the two-step \`messages-directory\` then \`messages-thread\` tutorial sequence.
- \`messages-directory\` uses \`Message\` as its highlighted action.
- \`messages-thread\` uses \`Send\` as its highlighted action and shows \`Chat with [person]\`, \`Connected\`, and \`Type your message\`.

- [ ] **Step 1: Write failing tutorial assertions**

Update the tutorial component test to assert:
- \`People you can message\`
- \`Find a person by name\`
- \`aria-label="Message"\`
- visible \`Message\`
- absence of \`Contact Directory\`, \`Total Contacts\`, and \`Admin Contacts\`
- \`Chat with\`
- \`Connected\`
- \`aria-label="Send"\`
- \`Type your message\`

Update the model test to expect \`tutorialDefinitions.messages[0].hotspotLabel === "Message"\`.

- [ ] **Step 2: Run the focused tutorial tests and verify RED**

~~~powershell
npm exec -- tsx --test tests/component/tutorials/messages-mock-scene.component.test.tsx tests/unit/features/tutorials/tutorial-model.unit.test.ts
~~~

Expected: FAIL because the tutorial still presents the dashboard and uses old labels.

- [ ] **Step 3: Implement the simplified tutorial scenes**

Update the two tutorial definitions with the exact plain-language instructions and hotspot labels from the spec. In \`messages-mock-scene.tsx\`:
- Remove the date pill and statistic cards.
- Render \`Messages\` with subtitle \`Choose someone to message.\`.
- Render \`People you can message\`, \`Find a person by name\`, \`Refresh contacts\`, and the contact card with a highlighted \`Message\` action.
- Render the thread as \`Chat with [person]\`, \`Connected\`, \`Type your message\`, and a highlighted \`Send\` action.
- Keep the offline supporting sentence and the simulated \`No messages yet\` state.

- [ ] **Step 4: Run the focused tutorial tests and verify GREEN**

~~~powershell
npm exec -- tsx --test tests/component/tutorials/messages-mock-scene.component.test.tsx tests/unit/features/tutorials/tutorial-model.unit.test.ts tests/component/tutorials/tutorial-scene-registry.component.test.tsx
~~~

Expected: PASS.

- [ ] **Step 5: Commit the tutorial alignment**

~~~powershell
git add frontend/src/features/tutorials/model/inspection-tutorial.ts frontend/src/features/tutorials/ui/scenes/messages-mock-scene.tsx frontend/tests/component/tutorials/messages-mock-scene.component.test.tsx frontend/tests/unit/features/tutorials/tutorial-model.unit.test.ts
git commit -m "feat: align messages tutorial with simplified flow"
~~~

### Task 4: Run the complete frontend gate and integrate

**Files:**
- Verify all files changed by Tasks 1–3.

- [ ] **Step 1: Run the targeted Messages and tutorial regression set**

~~~powershell
npm exec -- tsx --test tests/component/messages/messages-header.component.test.tsx tests/component/messages/contacts-panel.component.test.tsx tests/component/messages/thread-panel.component.test.tsx tests/unit/widgets/messages/thread-panel.unit.test.tsx tests/unit/state/messages-view-state.unit.test.ts tests/unit/features/tutorials/tutorial-model.unit.test.ts tests/component/tutorials/messages-mock-scene.component.test.tsx tests/component/tutorials/tutorial-scene-registry.component.test.tsx
~~~

Expected: PASS with no failures or skipped tests.

- [ ] **Step 2: Run typecheck, lint, build, and whitespace checks**

~~~powershell
npm run typecheck -w frontend
npm run lint -w frontend
npm run build:frontend
git diff --check origin/master..HEAD
~~~

Expected: typecheck/build exit 0, lint exit 0 with only the repository’s existing warnings, and no whitespace errors.

- [ ] **Step 3: Inspect scope and commit history**

~~~powershell
git status --short
git diff --name-only origin/master..HEAD
git log --oneline -6
~~~

Expected: only frontend Messages/tutorial files and the approved spec/plan docs are changed; no backend or database paths appear.

- [ ] **Step 4: Push the verified commits**

~~~powershell
git push
~~~

Expected: \`master\` updates successfully and \`git diff --quiet origin/master..HEAD\` exits 0.
