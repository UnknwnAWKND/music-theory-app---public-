import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCHEDULER_POLICY, ratingForAttempt } from "../dist/scheduler/index.js";

test("scheduler policy starts at 90 percent desired retention without treating it as mastery", () => {
  assert.equal(DEFAULT_SCHEDULER_POLICY.desiredRetention, 0.9);
  assert.equal(DEFAULT_SCHEDULER_POLICY.schedulerVersion, "fsrs-6");
});

test("objective attempt outcomes map to scheduler ratings without learner self-rating", () => {
  assert.equal(ratingForAttempt({ outcome: "correct", independent: true, directEvidence: true }), "good");
  assert.equal(ratingForAttempt({ outcome: "incorrect", independent: true, directEvidence: true }), "again");
  assert.equal(ratingForAttempt({ outcome: "hinted", independent: false, directEvidence: true }), "again");
  assert.equal(ratingForAttempt({ outcome: "revealed", independent: false, directEvidence: false }), "again");
});
