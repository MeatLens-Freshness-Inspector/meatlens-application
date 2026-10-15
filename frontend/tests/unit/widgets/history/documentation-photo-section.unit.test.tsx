import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import {
  DocumentationPhotoDetails,
  DocumentationPhotoSection,
} from "../../../../src/widgets/history/ui/documentation-photo-section";

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

test("View details contains the complete documentation photo details", () => {
  const savedPhoto = { ...photo("photo-1", "2026-10-15T08:00:00.000Z"), stall_number: "A-12" };
  const markup = renderToStaticMarkup(
    <DocumentationPhotoDetails
      entry={{
        kind: "saved",
        key: "saved-photo-1",
        capturedAt: savedPhoto.captured_at,
        location: savedPhoto.location,
        photo: savedPhoto,
      }}
      imageUrl={savedPhoto.image_url}
    />,
  );

  assert.match(markup, /Documentation photo details/);
  assert.match(markup, /Enlarge documentation photo/);
  assert.match(markup, /Tap to enlarge/);
  assert.match(markup, /Photo type/);
  assert.match(markup, /No analysis performed/);
  assert.match(markup, /Captured/);
  assert.match(markup, /Ikot Palengke/);
  assert.match(markup, /A-12/);
  assert.match(markup, /Saved to history/);
});

test("View details identifies an offline photo waiting to sync", () => {
  const capturedAt = "2026-10-15T08:00:00.000Z";
  const markup = renderToStaticMarkup(
    <DocumentationPhotoDetails
      entry={{
        kind: "pending",
        key: "pending-photo-1",
        capturedAt,
        location: "Ikot Palengke",
        photo: {
          id: "pending-photo-1",
          imageData: new ArrayBuffer(0),
          imageType: "image/jpeg",
          imageName: "stall.jpg",
          location: "Ikot Palengke",
          locationLatitude: null,
          locationLongitude: null,
          stallNumber: "B-04",
          capturedAt,
          queuedAt: capturedAt,
          userId: "user-1",
        },
      }}
      imageUrl="blob:pending-photo-1"
    />,
  );

  assert.match(markup, /Waiting to sync/);
  assert.match(markup, /B-04/);
});
