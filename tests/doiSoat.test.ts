import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDoiSoatRows,
  summarizeDoiSoatRows,
} from "../src/utils/doiSoat.ts";

test("normalizeDoiSoatRows keeps only aging groups that need audit", () => {
  const rows = normalizeDoiSoatRows([
    { aging_group: "24H -> 36H", trip_number: "TRIP-1" },
    { aging_group: "> 36H", trip_number: "TRIP-2" },
    { aging_group: "12H -> 24H", trip_number: "TRIP-3" },
    null,
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.trip_number), ["TRIP-1", "TRIP-2"]);
});

test("summarizeDoiSoatRows returns audit counters", () => {
  const rows = normalizeDoiSoatRows([
    { aging_group: "24H -> 36H" },
    { aging_group: "> 36H" },
    { aging_group: "> 36H" },
  ]);
  const summary = summarizeDoiSoatRows(rows);

  assert.equal(summary.total, 3);
  assert.equal(summary.count24To36, 1);
  assert.equal(summary.countOver36, 2);
});
