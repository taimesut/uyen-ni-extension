import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  RefreshCw,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { showToast } from "../components/Toast";
import { getFmsTrackingStatusLabel } from "../config/fmsTrackingStatus";
import { getCookies } from "../utils/config";
import {
  formatFmsElapsedHours,
  formatFmsTimestamp,
  getFmsElapsedGroup,
  getFmsElapsedGroupRank,
  type FmsElapsedGroup,
  type FmsResult,
} from "../utils/fms";
import { fetchFmsData } from "../utils/fmsApi";

const EMPTY_RESULT: FmsResult = {
  pageNo: 1,
  count: 24,
  total: 0,
  rows: [],
};

const PAGE_SIZE = 20;
type ElapsedFilter = "ALL" | Exclude<FmsElapsedGroup, "—">;

const StatusValue = ({ status }: { status: number }) => (
  <div className="space-y-1">
    <span className="inline-flex rounded-md bg-[#f3e5ea] px-2 py-0.5 font-mono text-xs font-black text-[#9f4664]">
      {status}
    </span>
    <div className="break-words text-[0.72rem] font-semibold leading-4 text-[#6f5f66]">
      {getFmsTrackingStatusLabel(status)}
    </div>
  </div>
);

const ElapsedGroupBadge = ({ group }: { group: FmsElapsedGroup }) => {
  const className =
    group === "> 36H"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : group === "24H → 36H"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : group === "< 24H"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[#e6d9de] bg-[#faf8f9] text-[#8a757e]";

  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-black ${className}`}>
      {group}
    </span>
  );
};

export const FmsPage = () => {
  const [result, setResult] = useState<FmsResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [elapsedFilter, setElapsedFilter] = useState<ElapsedFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [cookieAvailable, setCookieAvailable] = useState(() => Boolean(getCookies()));
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    const cookie = getCookies();
    setCookieAvailable(Boolean(cookie));

    if (!cookie) return;

    setLoading(true);
    try {
      setResult(await fetchFmsData(cookie, 1));
      setNowMs(Date.now());
      setCurrentPage(1);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không thể tải dữ liệu FMS.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = result.rows.filter((row) => {
      if (keyword && !row.shipmentId.toLowerCase().includes(keyword)) {
        return false;
      }

      if (elapsedFilter === "ALL") return true;

      const latest = row.latestTrackingEvent;
      if (!latest) return false;

      return getFmsElapsedGroup(latest.timestamp, nowMs) === elapsedFilter;
    });

    return [...filtered].sort((left, right) => {
      const leftLatest = left.latestTrackingEvent;
      const rightLatest = right.latestTrackingEvent;
      const leftGroup = leftLatest
        ? getFmsElapsedGroup(leftLatest.timestamp, nowMs)
        : "—";
      const rightGroup = rightLatest
        ? getFmsElapsedGroup(rightLatest.timestamp, nowMs)
        : "—";

      const groupDifference =
        getFmsElapsedGroupRank(leftGroup) - getFmsElapsedGroupRank(rightGroup);
      if (groupDifference !== 0) return groupDifference;

      if (!leftLatest && !rightLatest) return 0;
      if (!leftLatest) return 1;
      if (!rightLatest) return -1;

      return leftLatest.timestamp - rightLatest.timestamp;
    });
  }, [result.rows, search, elapsedFilter, nowMs]);

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
          <span className="soft-kicker">SPX FMS</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#44373d] sm:text-4xl">
            Dữ liệu FMS
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#786970]">
            Mỗi SPX chỉ hiển thị trạng thái cuối và được phân nhóm theo thời gian đã qua: &lt; 24H, 24H → 36H và &gt; 36H.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading || !cookieAvailable}
          className="btn btn-primary min-h-11 rounded-xl border-0 px-5 font-bold shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </section>

      {!cookieAvailable ? (
        <section className="surface-card flex flex-col items-start gap-4 p-5 sm:p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-[#493a40]">Chưa có SPX Cookie</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-[#796970]">
              Tab FMS cần Cookie đang đăng nhập SPX để gọi dữ liệu nội bộ.
            </p>
          </div>
          <Link
            to="/cai-dat"
            className="btn min-h-10 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-[#8f4d63] shadow-none hover:bg-[#faf4f6]"
          >
            <KeyRound className="h-4 w-4" />
            Mở cài đặt Cookie
          </Link>
        </section>
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="space-y-3 border-b border-[#eadde2] p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a68591]" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="input min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] pl-11 font-medium outline-none focus:border-[#c98ba0] focus:bg-white"
                  placeholder="Tìm SPX Tracking Number..."
                />
              </div>

              <select
                value={elapsedFilter}
                onChange={(event) => {
                  setElapsedFilter(event.target.value as ElapsedFilter);
                  setCurrentPage(1);
                }}
                className="select min-h-11 w-full rounded-xl border-[#e6d9de] bg-[#fcfafb] font-bold text-[#6f5f66] outline-none focus:border-[#c98ba0] focus:bg-white"
                aria-label="Lọc nhóm thời gian đã qua"
              >
                <option value="ALL">Tất cả nhóm thời gian</option>
                <option value="< 24H">&lt; 24H</option>
                <option value="24H → 36H">24H → 36H</option>
                <option value="> 36H">&gt; 36H</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#8d7982]">
              <span>Sắp xếp ưu tiên: &gt; 36H → 24H → 36H → &lt; 24H</span>
              <span>{rows.length} kết quả · {PAGE_SIZE} đơn/trang</span>
            </div>
          </div>

          <div className="md:hidden">
            {loading && result.rows.length === 0 ? (
              <div className="p-10 text-center text-sm font-semibold text-[#9f6c7d]">
                Đang tải dữ liệu FMS...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm font-semibold text-[#87747c]">
                Không có dữ liệu phù hợp.
              </div>
            ) : (
              <div className="divide-y divide-[#eee5e8]">
                {pageRows.map((row) => {
                  const latest = row.latestTrackingEvent;
                  const elapsedGroup = latest
                    ? getFmsElapsedGroup(latest.timestamp, nowMs)
                    : "—";

                  return (
                    <article key={row.shipmentId} className="space-y-4 p-4">
                      <div>
                        <div className="field-label">SPX Tracking Number</div>
                        <div className="mt-1 break-all font-mono text-sm font-black text-[#493a40]">
                          {row.shipmentId}
                        </div>
                      </div>

                      <div>
                        <span className="field-label">TO Number</span>
                        <div className="field-value">{row.currentToNumber || "—"}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="field-label">Trạng thái cuối</span>
                          <div className="mt-1">
                            {latest ? <StatusValue status={latest.status} /> : "—"}
                          </div>
                        </div>
                        <div>
                          <span className="field-label">Nhóm thời gian</span>
                          <div className="mt-1">
                            <ElapsedGroupBadge group={elapsedGroup} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="field-label">Cập nhật cuối</span>
                          <div className="field-value">
                            {latest ? formatFmsTimestamp(latest.timestamp) : "—"}
                          </div>
                        </div>
                        <div>
                          <span className="field-label">Đã qua</span>
                          <div className="field-value font-black text-[#9f4664]">
                            {latest ? formatFmsElapsedHours(latest.timestamp, nowMs) : "—"}
                          </div>
                        </div>
                      </div>

                      {row.trackingError ? (
                        <div className="text-xs font-semibold text-rose-700">
                          {row.trackingError}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="table min-w-[1050px]">
              <thead>
                <tr className="border-[#eadde2] bg-[#faf7f8] text-[#6f5f66]">
                  <th>SPX Tracking Number</th>
                  <th>TO Number</th>
                  <th>Trạng thái cuối</th>
                  <th>Cập nhật cuối</th>
                  <th>Đã qua</th>
                  <th>Nhóm thời gian</th>
                </tr>
              </thead>
              <tbody>
                {loading && result.rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-semibold text-[#9f6c7d]">
                      Đang tải dữ liệu FMS...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-semibold text-[#87747c]">
                      Không có dữ liệu phù hợp.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const latest = row.latestTrackingEvent;
                    const elapsedGroup = latest
                      ? getFmsElapsedGroup(latest.timestamp, nowMs)
                      : "—";

                    return (
                      <tr
                        key={row.shipmentId}
                        className="border-[#eee5e8] align-middle hover:bg-[#fcfafb]"
                      >
                        <td className="font-mono text-xs font-black text-[#493a40]">
                          {row.shipmentId}
                        </td>
                        <td className="font-mono text-xs font-semibold">
                          {row.currentToNumber || "—"}
                        </td>
                        <td>
                          {latest ? <StatusValue status={latest.status} /> : "—"}
                        </td>
                        <td className="whitespace-nowrap text-xs font-semibold">
                          {latest ? formatFmsTimestamp(latest.timestamp) : "—"}
                        </td>
                        <td className="whitespace-nowrap font-black text-[#9f4664]">
                          {latest ? formatFmsElapsedHours(latest.timestamp, nowMs) : "—"}
                        </td>
                        <td>
                          <ElapsedGroupBadge group={elapsedGroup} />
                        </td>
                      </tr>
                    );
                  })
                )}
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
      )}
    </div>
  );
};
