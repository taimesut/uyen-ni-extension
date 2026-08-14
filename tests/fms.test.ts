import assert from "node:assert/strict";
import test from "node:test";
import { getFmsTrackingStatusLabel } from "../src/config/fmsTrackingStatus.ts";
import {
  formatFmsElapsedHours,
  getFmsElapsedHours,
  getLatestFmsTrackingEvent,
  normalizeFmsResult,
} from "../src/utils/fms.ts";

test("normalizeFmsResult keeps SPX rows and tracking status timestamps", () => {
  const result = normalizeFmsResult({
    page_no: 1,
    count: 24,
    total: 1,
    rows: [
      {
        shipment_id: "SPXVN060473505378",
        current_to_number: "TO2026081468TNH",
        order_status: 880,
        bulky_type: 2,
        current_station_name: "Pleiku SOC",
        next_station_name: "44-GLI Pleiku 03 Hub",
        tracking_events: [
          { id: 2, status: 42, timestamp: 1786522640 },
          { id: 1, status: 0, timestamp: 1786496388 },
        ],
      },
    ],
  });

  assert.equal(result.total, 1);
  assert.equal(result.rows[0]?.shipmentId, "SPXVN060473505378");
  assert.deepEqual(
    result.rows[0]?.trackingEvents.map((event) => [event.status, event.timestamp]),
    [
      [0, 1786496388],
      [42, 1786522640],
    ],
  );
});

test("FMS status map resolves codes from tracking_status_list", () => {
  assert.equal(getFmsTrackingStatusLabel(0), "Created");
  assert.equal(getFmsTrackingStatusLabel(42), "FMHub_Received");
  assert.equal(getFmsTrackingStatusLabel(880), "LMHub_LHArrived");
  assert.equal(getFmsTrackingStatusLabel(36), "SOC_LHTransported");
  assert.equal(getFmsTrackingStatusLabel(15), "SOC_LHTransporting");
  assert.equal(getFmsTrackingStatusLabel(999999), "Unknown_999999");
});

test("latest FMS event and elapsed hours use the newest timestamp", () => {
  const result = normalizeFmsResult({
    rows: [
      {
        shipment_id: "SPX-1",
        tracking_events: [
          { id: 1, status: 0, timestamp: 1000 },
          { id: 2, status: 42, timestamp: 4600 },
          { id: 3, status: 36, timestamp: 2800 },
        ],
      },
    ],
  });

  const row = result.rows[0];
  assert.ok(row);

  const latest = getLatestFmsTrackingEvent(row);
  assert.equal(latest?.status, 42);
  assert.equal(latest?.timestamp, 4600);

  const nowMs = (4600 + 3.5 * 3600) * 1000;
  assert.equal(getFmsElapsedHours(4600, nowMs), 3.5);
  assert.equal(formatFmsElapsedHours(4600, nowMs), "3.5 giờ");
});
