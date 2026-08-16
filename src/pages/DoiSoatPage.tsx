import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
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

const PAGE_SIZE = 20;
type AgingFilter = "ALL" | DoiSoatAgingGroup;

export const DoiSoatPage = () => {
  const [result, setResult] = useState<DoiSoatResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState<AgingFilter>("ALL");
  const [bulkyFilter, setBulkyFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await fetchDoiSoatRaw());
      setCurrentPage(1);
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

  const bulkyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          result.rows
            .map((row) => row.bulky_type.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, "vi", { numeric: true })),
    [result.rows],
  );

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return result.rows.filter((row) => {
      if (agingFilter !== "ALL" && row.aging_group !== agingFilter) return false;
      if (bulkyFilter !== "ALL" && row.bulky_type !== bulkyFilter) return false;
      if (!keyword) return true;

      return [
        row.trip_number,
        row.to_number,
        row.fleet_order_id,
        row.last_status_tracking,
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [agingFilter, bulkyFilter, result.rows, search]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE);
  const resultStart = rows.length === 0 ? 0 : pageStart + 1;
  const resultEnd = Math.min(pageStart + PAGE_SIZE, rows.length);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a68591]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                className="input min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] pl-11 font-medium outline-none focus:border-[#c98ba0] focus:bg-white"
                placeholder="Tìm Trip, TO, SPX Tracking Number, trạng thái..."
              />
            </div>

            <select
              value={agingFilter}
              onChange={(event) => {
                setAgingFilter(event.target.value as AgingFilter);
                setCurrentPage(1);
              }}
              className="select min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] font-bold text-[#6f5f66] outline-none focus:border-[#c98ba0] focus:bg-white"
              aria-label="Lọc Aging Group"
            >
              <option value="ALL">Tất cả Aging Group</option>
              <option value="24H -> 36H">24H → 36H</option>
              <option value="> 36H">&gt; 36H</option>
            </select>

            <select
              value={bulkyFilter}
              onChange={(event) => {
                setBulkyFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="select min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] font-bold text-[#6f5f66] outline-none focus:border-[#c98ba0] focus:bg-white"
              aria-label="Lọc Bulky Type"
            >
              <option value="ALL">Tất cả Bulky Type</option>
              {bulkyOptions.map((bulkyType) => (
                <option key={bulkyType} value={bulkyType}>
                  {bulkyType}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#8d7982]">
            <span>Search theo Trip, TO, SPX Tracking Number và trạng thái cuối</span>
            <span>{rows.length} kết quả · {PAGE_SIZE} dòng/trang</span>
          </div>
        </div>

        <div className="md:hidden">
          {loading && result.rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-[#9f6c7d]">Đang tải dữ liệu...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm font-semibold text-[#87747c]">Không có dữ liệu phù hợp.</div>
          ) : (
            <div className="divide-y divide-[#eee5e8]">
              {pageRows.map((row, index) => (
                <article key={`${row.trip_number}-${row.to_number}-${row.fleet_order_id}-${pageStart + index}`} className="space-y-3 p-4">
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
              {loading && result.rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center font-semibold text-[#9f6c7d]">Đang tải dữ liệu...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center font-semibold text-[#87747c]">Không có dữ liệu phù hợp.</td></tr>
              ) : pageRows.map((row, index) => (
                <tr key={`${row.trip_number}-${row.to_number}-${row.fleet_order_id}-${pageStart + index}`} className="border-[#eee5e8] hover:bg-[#fcfafb]">
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

        <div className="flex flex-col gap-3 border-t border-[#eadde2] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <span className="text-xs font-bold text-[#7f6c75]">
            Hiển thị {resultStart}-{resultEnd} / {rows.length} kết quả
          </span>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              className="btn min-h-10 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-[#6f5f66] shadow-none hover:bg-[#faf4f6]"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </button>

            <span className="min-w-24 text-center text-xs font-bold text-[#7f6c75]">
              Trang {currentPage} / {pageCount}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage >= pageCount}
              className="btn min-h-10 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-[#6f5f66] shadow-none hover:bg-[#faf4f6]"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
