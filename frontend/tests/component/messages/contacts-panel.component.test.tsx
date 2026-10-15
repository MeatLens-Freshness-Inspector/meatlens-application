import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { ContactsPanel } from "../../../src/widgets/messages";

Object.assign(globalThis, { React });

test("uses plain contact controls and a visible message action", () => {
  const html = renderToStaticMarkup(
    <ContactsPanel
      contacts={[{
        id: "admin-1",
        full_name: "Support Admin",
        email: "admin@example.com",
        inspector_code: null,
        location: null,
        role: "admin",
        last_message_preview: null,
        last_message_at: null,
      }]}
      selectedContactId={null}
      contactSearch=""
      isAdmin={false}
      isLoadingContacts={false}
      onSearchChange={() => {}}
      onRefresh={() => {}}
      onSelectContact={() => {}}
    />,
  );

  assert.match(html, /People you can message/);
  assert.match(html, /Find a person by name/);
  assert.match(html, /aria-label="Refresh contacts"/);
  assert.match(html, />Refresh contacts</);
  assert.match(html, />Message</);
  assert.doesNotMatch(html, /Contact Directory|Search by name, email, code/);
});
