export const DOI_SOAT_AGING_GROUPS = ["24H -> 36H", "> 36H"] as const;

export type DoiSoatAgingGroup = (typeof DOI_SOAT_AGING_GROUPS)[number];

export interface DoiSoatRow {
  trip_number: string;
  to_number: string;
  fleet_order_id: string;
  bulky_type: string;
  arrived_time: string;
  last_status_tracking: string;
  aging_group: DoiSoatAgingGroup;
}

export interface DoiSoatResult {
  rows: DoiSoatRow[];
  total: number;
  count24To36: number;
  countOver36: number;
}

export const isDoiSoatAgingGroup = (value: unknown): value is DoiSoatAgingGroup =>
  typeof value === "string" &&
  DOI_SOAT_AGING_GROUPS.includes(value.trim() as DoiSoatAgingGroup);

const asText = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

export const normalizeDoiSoatRows = (value: unknown): DoiSoatRow[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const row = item as Record<string, unknown>;
    const aging = asText(row.aging_group);
    if (!isDoiSoatAgingGroup(aging)) return [];

    return [{
      trip_number: asText(row.trip_number),
      to_number: asText(row.to_number),
      fleet_order_id: asText(row.fleet_order_id),
      bulky_type: asText(row.bulky_type),
      arrived_time: asText(row.arrived_time),
      last_status_tracking: asText(row.last_status_tracking),
      aging_group: aging,
    }];
  });
};

export const summarizeDoiSoatRows = (rows: readonly DoiSoatRow[]): DoiSoatResult => ({
  rows: [...rows],
  total: rows.length,
  count24To36: rows.filter((row) => row.aging_group === "24H -> 36H").length,
  countOver36: rows.filter((row) => row.aging_group === "> 36H").length,
});
