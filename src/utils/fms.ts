export interface FmsTrackingEvent {
  id: number;
  status: number;
  timestamp: number;
  message: string;
  stationName: string;
}

export interface FmsOrderRow {
  shipmentId: string;
  currentToNumber: string;
  orderStatus: number;
  bulkyType: number;
  currentStationName: string;
  nextStationName: string;
  latestTrackingEvent: FmsTrackingEvent | null;
  trackingError: string;
}

export interface FmsResult {
  pageNo: number;
  count: number;
  total: number;
  rows: FmsOrderRow[];
}

const asObject = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const asNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTrackingEvent = (value: unknown): FmsTrackingEvent | null => {
  const event = asObject(value);
  if (!event) return null;

  return {
    id: asNumber(event.id),
    status: asNumber(event.status),
    timestamp: asNumber(event.timestamp),
    message: asString(event.message),
    stationName: asString(event.station_name ?? event.stationName),
  };
};

const getLatestEvent = (events: FmsTrackingEvent[]): FmsTrackingEvent | null => {
  let latest: FmsTrackingEvent | null = null;

  for (const event of events) {
    if (!latest || event.timestamp > latest.timestamp) latest = event;
  }

  return latest;
};

const normalizeRow = (value: unknown): FmsOrderRow | null => {
  const row = asObject(value);
  if (!row) return null;

  const shipmentId = asString(row.shipment_id ?? row.shipmentId).trim();
  if (!shipmentId) return null;

  const explicitLatest = normalizeTrackingEvent(
    row.latest_tracking_event ?? row.latestTrackingEvent,
  );

  const legacyRawEvents = Array.isArray(row.tracking_events)
    ? row.tracking_events
    : Array.isArray(row.trackingEvents)
      ? row.trackingEvents
      : [];

  const legacyLatest = getLatestEvent(
    legacyRawEvents
      .map(normalizeTrackingEvent)
      .filter((event): event is FmsTrackingEvent => event !== null),
  );

  return {
    shipmentId,
    currentToNumber: asString(row.current_to_number ?? row.currentToNumber),
    orderStatus: asNumber(row.order_status ?? row.orderStatus),
    bulkyType: asNumber(row.bulky_type ?? row.bulkyType),
    currentStationName: asString(
      row.current_station_name ?? row.currentStationName,
    ),
    nextStationName: asString(row.next_station_name ?? row.nextStationName),
    latestTrackingEvent: explicitLatest ?? legacyLatest,
    trackingError: asString(row.tracking_error ?? row.trackingError),
  };
};

export const normalizeFmsResult = (value: unknown): FmsResult => {
  const result = asObject(value);
  const rawRows = result && Array.isArray(result.rows) ? result.rows : [];
  const rows = rawRows
    .map(normalizeRow)
    .filter((row): row is FmsOrderRow => row !== null);

  return {
    pageNo: Math.max(1, asNumber(result?.page_no ?? result?.pageNo) || 1),
    count: Math.max(1, asNumber(result?.count) || 24),
    total: Math.max(0, asNumber(result?.total)),
    rows,
  };
};

export const getFmsElapsedHours = (
  timestamp: number,
  nowMs = Date.now(),
): number | null => {
  if (!Number.isFinite(timestamp) || timestamp <= 0 || !Number.isFinite(nowMs)) {
    return null;
  }

  return Math.max(0, nowMs - timestamp * 1000) / 3_600_000;
};

export const formatFmsElapsedHours = (
  timestamp: number,
  nowMs = Date.now(),
): string => {
  const hours = getFmsElapsedHours(timestamp, nowMs);
  if (hours === null) return "—";
  if (hours < 0.1) return "< 0.1 giờ";
  return `${hours.toFixed(1)} giờ`;
};

export const formatFmsTimestamp = (timestamp: number): string => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp * 1000));
};
