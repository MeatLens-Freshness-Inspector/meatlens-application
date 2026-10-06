import assert from "node:assert/strict";
import test from "node:test";

import { isTermsScrollAtBottom } from "../../../../src/widgets/legal/terms-dialog-scroll";

test("terms scroll predicate requires the content boundary", () => {
  assert.equal(
    isTermsScrollAtBottom({ scrollTop: 400, clientHeight: 300, scrollHeight: 1000 }),
    false,
  );
  assert.equal(
    isTermsScrollAtBottom({ scrollTop: 700, clientHeight: 300, scrollHeight: 1000 }),
    true,
  );
  assert.equal(
    isTermsScrollAtBottom({ scrollTop: 0, clientHeight: 0, scrollHeight: 0 }),
    false,
  );
});
