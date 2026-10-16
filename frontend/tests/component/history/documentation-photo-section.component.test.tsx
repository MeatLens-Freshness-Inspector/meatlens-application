import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DocumentationPhotoSection } from "../../../src/widgets/history/ui/documentation-photo-section";
import type { DocumentationPhoto } from "../../../src/entities/documentation-photo";

Object.assign(globalThis, { React });

const photo: DocumentationPhoto = {
  id: "documentation-photo-1",
  user_id: "user-1",
  client_submission_id: "submission-documentation-photo-1",
  image_url: "https://example.test/documentation-photo.jpg",
  location: "Ikot Palengke",
  location_latitude: null,
  location_longitude: null,
  stall_number: "A-12",
  captured_at: "2026-10-16T08:00:00.000Z",
  created_at: "2026-10-16T08:00:00.000Z",
  updated_at: "2026-10-16T08:00:00.000Z",
};

test("keeps documentation photo cards hidden until requested", () => {
  const markup = renderToStaticMarkup(
    <DocumentationPhotoSection photos={[photo]} pendingPhotos={[]} />,
  );

  assert.match(markup, /Documentation photos/);
  assert.match(markup, /Show documentation photos/);
  assert.doesNotMatch(markup, /data-testid="documentation-photo-card-layout"/);
});
