import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFmsResult } from "../src/utils/fms.ts";

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
