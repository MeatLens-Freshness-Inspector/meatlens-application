import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { DocumentationPhotoSection } from "../../../../src/widgets/history/ui/documentation-photo-section";

Object.assign(globalThis, { React });

const photo = (id: string, capturedAt: string) => ({
  id,
  user_id: "user-1",
  client_submission_id: `submission-${id}`,
  image_url: `https://example.test/${id}.jpg`,
  location: "Ikot Palengke",
  location_latitude: null,
  location_longitude: null,
  stall_number: null,
  captured_at: capturedAt,
  created_at: capturedAt,
  updated_at: capturedAt,
});

test("documentation photos use compact inspection-style cards", () => {
  const markup = renderToStaticMarkup(
    <DocumentationPhotoSection
      photos={[
        photo("photo-1", "2026-10-15T08:00:00.000Z"),
        photo("photo-2", "2026-10-15T07:00:00.000Z"),
        photo("photo-3", "2026-10-15T06:00:00.000Z"),
        photo("photo-4", "2026-10-15T05:00:00.000Z"),
      ]}
      pendingPhotos={[]}
    />,
  );

  assert.equal((markup.match(/data-testid="documentation-photo-card-layout"/g) ?? []).length, 3);
  assert.match(markup, /Documentation photo/);
  assert.match(markup, /No analysis result/);
  assert.match(markup, /View details/);
  assert.match(markup, /Show all documentation photos/);
  assert.doesNotMatch(markup, /grid-cols-3/);
});
