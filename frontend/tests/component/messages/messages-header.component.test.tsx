import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { MessagesHeader } from "../../../src/widgets/messages";

Object.assign(globalThis, { React });

test("presents a plain-language message task without dashboard statistics", () => {
  const html = renderToStaticMarkup(<MessagesHeader />);

  assert.match(html, /Messages/);
  assert.match(html, /Choose someone to message\./);
  assert.doesNotMatch(html, /Total Contacts|Admin Contacts|User Contacts|Latest Activity/);
  assert.doesNotMatch(
    html,
    /January|February|March|April|May|June|July|August|September|October|November|December/,
  );
});
