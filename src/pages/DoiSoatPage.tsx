import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  PackageSearch,
  RefreshCw,
  Search,
} from "lucide-react";
import { showToast } from "../components/Toast";
import {
  type DoiSoatAgingGroup,
  type DoiSoatResult,
} from "../utils/doiSoat";
import { fetchDoiSoatRaw } from "../utils/doiSoatApi";

const EMPTY_RESULT: DoiSoatResult = {
  rows: [],
  total: 0,
  count24To36: 0,
  countOver36: 0,
};

type AgingFilter = "ALL" | DoiSoatAgingGroup;

const FILTERS: Array<{ value: AgingFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "24H -> 36H", label: "24H → 36H" },
  { value: "> 36H", label: "> 36H" },
];

export const DoiSoatPage = () => {
  const [result, setResult] = useState<DoiSoatResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState<AgingFilter>("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchDoiSoatRaw());
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không thể tải dữ liệu đối soát.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return result.rows.filter((row) => {
      if (agingFilter !== "ALL" && row.aging_group !== agingFilter) return false;
      if (!keyword) return true;

      return [
        row.trip_number,
        row.to_number,
        row.fleet_order_id,
        row.bulky_type,
        row.arrived_time,
        row.last_status_tracking,
        row.aging_group,
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [agingFilter, result.rows, search]);

  return (
    <div className="app-page space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="soft-kicker">Audit workspace</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#44373d] sm:text-4xl">
            Đối soát
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#786970]">
            Dữ liệu từ sheet <strong className="font-bold text-[#9f4664]">raw</strong>, chỉ hiển thị hai nhóm aging cần audit.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="btn btn-primary min-h-11 rounded-xl border-0 px-5 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#817078]">Tổng audit</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
              <PackageSearch className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-[#493a40]">{result.total}</div>
        </div>

        <div className="surface-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-amber-700">24H → 36H</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-amber-700">{result.count24To36}</div>
        </div>

        <div className="surface-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-rose-700">&gt; 36H</span>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-black text-rose-700">{result.countOver36}</div>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="space-y-3 border-b border-[#eadde2] p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a68591]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] pl-11 font-medium outline-none focus:border-[#c98ba0] focus:bg-white"
              placeholder="Tìm trip, TO, tracking, trạng thái..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setAgingFilter(filter.value)}
                className={`min-h-9 rounded-lg px-3.5 text-xs font-bold transition ${
                  agingFilter === filter.value
                    ? "bg-[#c45d7c] text-white"
                    : "border border-[#e6d9de] bg-white text-[#6f5f66] hover:bg-[#faf4f6]"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <span className="ml-auto self-center text-xs font-semibold text-[#8d7982]">
              {rows.length} dòng
            </span>
          </div>
        </div>

        <div className="md:hidden">
          {loading && rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-[#9f6c7d]">Đang tải dữ liệu...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-[#87747c]">Không có dữ liệu cần audit.</div>
          ) : (
            <div className="divide-y divide-[#eee5e8]">
              {rows.map((row, index) => (
                <article key={`${row.trip_number}-${row.to_number}-${row.fleet_order_id}-${index}`} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="field-label">SPX Tracking Number</div>
                      <div className="mt-1 break-all font-mono text-sm font-bold text-[#493a40]">{row.fleet_order_id || "—"}</div>
                    </div>
                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${row.aging_group === "> 36H" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {row.aging_group}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="field-label">Trip</span><div className="field-value">{row.trip_number || "—"}</div></div>
                    <div><span className="field-label">TO Number</span><div className="field-value">{row.to_number || "—"}</div></div>
                    <div><span className="field-label">Bulky Type</span><div className="field-value">{row.bulky_type || "—"}</div></div>
                    <div><span className="field-label">Arrived Time</span><div className="field-value">{row.arrived_time || "—"}</div></div>
                  </div>

                  <div>
                    <span className="field-label">Last Status Tracking</span>
                    <div className="field-value">{row.last_status_tracking || "—"}</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="table min-w-[1080px]">
            <thead>
              <tr className="border-[#eadde2] bg-[#faf7f8] text-[#6f5f66]">
                <th>Trip Number</th>
                <th>TO Number</th>
                <th>SPX Tracking Number</th>
                <th>Bulky Type</th>
                <th>Arrived Time</th>
                <th>Last Status Tracking</th>
                <th>Aging Group</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center font-semibold text-[#9f6c7d]">Đang tải dữ liệu...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center font-semibold text-[#87747c]">Không có dữ liệu cần audit.</td></tr>
              ) : rows.map((row, index) => (
                <tr key={`${row.trip_number}-${row.to_number}-${row.fleet_order_id}-${index}`} className="border-[#eee5e8] hover:bg-[#fcfafb]">
                  <td className="font-bold text-[#493a40]">{row.trip_number || "—"}</td>
                  <td className="font-medium">{row.to_number || "—"}</td>
                  <td className="font-mono text-xs font-semibold">{row.fleet_order_id || "—"}</td>
                  <td>{row.bulky_type || "—"}</td>
                  <td>{row.arrived_time || "—"}</td>
                  <td>{row.last_status_tracking || "—"}</td>
                  <td>
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${row.aging_group === "> 36H" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                      {row.aging_group}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
