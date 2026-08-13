import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, RefreshCw, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { showToast } from "../components/Toast";
import { fetchDoiSoatRaw } from "../utils/doiSoatApi";
import type { DoiSoatResult } from "../utils/doiSoat";

const EMPTY_RESULT: DoiSoatResult = {
  rows: [],
  total: 0,
  count24To36: 0,
  countOver36: 0,
};

export const DoiSoatPage = () => {
  const [result, setResult] = useState<DoiSoatResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      setResult(await fetchDoiSoatRaw());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể tải dữ liệu đối soát.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return result.rows;
    return result.rows.filter((row) =>
      [row.trip_number, row.to_number, row.fleet_order_id, row.last_status_tracking, row.aging_group]
        .some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [result.rows, search]);

  return (
    <div className="app-page space-y-5 text-base-content md:space-y-6">
      <PageHeader
        icon={ClipboardCheck}
        title="Đối soát"
        description="Dữ liệu từ sheet raw, chỉ hiển thị aging 24H -> 36H và > 36H."
        tone="warning"
        actions={
          <button type="button" onClick={() => void loadData()} disabled={loading} className="btn btn-primary min-h-11 rounded-xl gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="app-surface p-4"><div className="text-xs font-bold uppercase text-base-content/55">Tổng audit</div><div className="mt-1 text-3xl font-black">{result.total}</div></div>
        <div className="app-surface p-4"><div className="text-xs font-bold uppercase text-warning">24H - 36H</div><div className="mt-1 text-3xl font-black text-warning">{result.count24To36}</div></div>
        <div className="app-surface p-4"><div className="text-xs font-bold uppercase text-error">&gt; 36H</div><div className="mt-1 text-3xl font-black text-error">{result.countOver36}</div></div>
      </section>

      <section className="app-surface overflow-hidden">
        <div className="border-b border-base-200 p-4 sm:p-5">
          <label className="input input-bordered flex min-h-11 items-center gap-2 rounded-xl">
            <Search className="h-4 w-4 opacity-60" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="grow" placeholder="Tìm trip, TO, SPX Tracking Number, trạng thái..." />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra table-sm min-w-[1100px]">
            <thead>
              <tr>
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
                <tr><td colSpan={7} className="py-10 text-center">Đang tải dữ liệu...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-base-content/60">Không có dữ liệu cần audit.</td></tr>
              ) : rows.map((row, index) => (
                <tr key={`${row.trip_number}-${row.to_number}-${row.fleet_order_id}-${index}`}>
                  <td className="font-semibold">{row.trip_number || "—"}</td>
                  <td>{row.to_number || "—"}</td>
                  <td className="font-mono text-xs">{row.fleet_order_id || "—"}</td>
                  <td>{row.bulky_type || "—"}</td>
                  <td>{row.arrived_time || "—"}</td>
                  <td>{row.last_status_tracking || "—"}</td>
                  <td>
                    <span className={`badge font-bold ${row.aging_group === "> 36H" ? "badge-error" : "badge-warning"}`}>
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
