import assert from "node:assert/strict";
import test from "node:test";
import { GenerationCancelledError } from "../src/chatCompletion";
import {
  GenerationCancellation,
  LogicalRequestBudget,
} from "../src/generationControl";
import { Semaphore } from "../src/utils";

void test("logical request budget stops accidental request expansion", () => {
  const budget = new LogicalRequestBudget(2);
  assert.equal(budget.consume(), 1);
  assert.equal(budget.consume(), 2);
  assert.throws(() => budget.consume(), /budget exceeded/i);
});

void test("cooperative cancellation stops queued work before transport", () => {
  const cancellation = new GenerationCancellation();
  cancellation.cancel();
  assert.throws(
    () => cancellation.throwIfCancelled(),
    GenerationCancelledError,
  );
});

void test("semaphore enforces peak concurrency and releases permits", async () => {
  const semaphore = new Semaphore(2);
  const releases: Array<() => void> = [];
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 3 }, () =>
    semaphore.run(
      () =>
        new Promise<void>((resolve) => {
          active += 1;
          peak = Math.max(peak, active);
          releases.push(() => {
            active -= 1;
            resolve();
          });
        }),
    ),
  );

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(releases.length, 2);
  releases[0]();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(releases.length, 3);
  releases[1]();
  releases[2]();
  await Promise.all(tasks);

  assert.equal(peak, 2);
  assert.equal(active, 0);
});
