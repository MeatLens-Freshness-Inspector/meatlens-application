import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { MessagesMockScene, tutorialDefinitions, tutorialFixtures } from "../../../src/features/tutorials";

test("messages tutorial mirrors the contact directory and connected thread", () => {
  const directory = renderToStaticMarkup(
    <MessagesMockScene step={tutorialDefinitions.messages[0]} onAdvance={() => {}} />,
  );
  const thread = renderToStaticMarkup(
    <MessagesMockScene step={tutorialDefinitions.messages[1]} onAdvance={() => {}} />,
  );

  assert.match(directory, /data-tutorial-tab="messages"[^>]*data-active="true"/);
  assert.match(directory, new RegExp(tutorialFixtures.messages.contactLabel));
  assert.match(directory, /People you can message/);
  assert.match(directory, /Find a person by name/);
  assert.match(directory, /aria-label="Message"/);
  assert.match(directory, />Message</);
  assert.doesNotMatch(directory, /Contact Directory|Total Contacts|Admin Contacts/);
  assert.match(thread, /Chat with/);
  assert.match(thread, /Connected/);
  assert.match(thread, /aria-label="Send"/);
  assert.match(thread, /Type your message/);
});
