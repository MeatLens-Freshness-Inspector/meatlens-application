import assert from "node:assert/strict";
import test from "node:test";
import { validateSignupState } from "../../../../src/features/auth/model/signup";

const validOrganization = (value: unknown): value is "dti" => value === "dti";

test("signup workflow reports the first unmet account requirement", () => {
  assert.equal(
    validateSignupState(
      {
        acceptedPrivacy: false,
        acceptedTerms: false,
        termsReadToEnd: false,
        accessCode: "",
        reportOrganization: "",
      },
      validOrganization,
    ),
    "Please open and read the Terms and Conditions through the end before accepting them.",
  );
  assert.equal(
    validateSignupState(
      {
        acceptedPrivacy: true,
        acceptedTerms: true,
        termsReadToEnd: false,
        accessCode: "code",
        reportOrganization: "dti",
      },
      validOrganization,
    ),
    "Please open and read the Terms and Conditions through the end before accepting them.",
  );
  assert.equal(
    validateSignupState({
      acceptedPrivacy: true,
      acceptedTerms: true,
      termsReadToEnd: true,
      accessCode: "code",
      reportOrganization: "dti",
    }, validOrganization),
    null,
  );
});
