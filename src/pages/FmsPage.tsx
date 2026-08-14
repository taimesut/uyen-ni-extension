import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
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
  type FmsResult,
} from "../utils/fms";
import { fetchFmsData } from "../utils/fmsApi";

const EMPTY_RESULT: FmsResult = {
  pageNo: 1,
  count: 24,
  total: 0,
  rows: [],
};

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

export const FmsPage = () => {
  const [result, setResult] = useState<FmsResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cookieAvailable, setCookieAvailable] = useState(() => Boolean(getCookies()));
  const [nowMs, setNowMs] = useState(() => Date.now());

  const loadData = useCallback(async (pageNo: number) => {
    const cookie = getCookies();
    setCookieAvailable(Boolean(cookie));

    if (!cookie) return;

    setLoading(true);
    try {
      setResult(await fetchFmsData(cookie, pageNo));
      setNowMs(Date.now());
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
    void loadData(1);
  }, [loadData]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return result.rows;

    return result.rows.filter((row) => {
      const latest = row.latestTrackingEvent;
      return [
        row.shipmentId,
        row.currentToNumber,
        String(row.orderStatus),
        getFmsTrackingStatusLabel(row.orderStatus),
        String(row.bulkyType),
        row.currentStationName,
        row.nextStationName,
        latest ? String(latest.status) : "",
        latest ? getFmsTrackingStatusLabel(latest.status) : "",
        latest ? String(latest.timestamp) : "",
        latest?.message ?? "",
        latest?.stationName ?? "",
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  }, [result.rows, search]);

  const pageCount = Math.max(1, Math.ceil(result.total / result.count));
  const rowsWithLatestStatus = rows.filter((row) => row.latestTrackingEvent !== null).length;

  return (
    <div className="app-page space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="soft-kicker">SPX FMS</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#44373d] sm:text-4xl">
            Dữ liệu FMS
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#786970]">
            Mỗi SPX chỉ hiển thị trạng thái tracking cuối cùng theo timestamp mới nhất.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData(result.pageNo)}
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
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#817078]">Tổng FMS</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3e5ea] text-[#a64e6b]">
                  <Database className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-[#493a40]">{result.total}</div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#817078]">Trang hiện tại</div>
              <div className="mt-3 text-3xl font-black text-[#493a40]">{result.pageNo}</div>
              <div className="mt-1 text-xs font-semibold text-[#927e87]">{rows.length} / {result.count} đơn</div>
            </div>

            <div className="surface-card p-4 sm:p-5">
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#817078]">Có status cuối</div>
              <div className="mt-3 text-3xl font-black text-[#493a40]">{rowsWithLatestStatus}</div>
              <div className="mt-1 text-xs font-semibold text-[#927e87]">{pageCount} trang FMS</div>
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
                  placeholder="Tìm SPX, TO, status cuối, timestamp, station..."
                />
              </div>
              <div className="text-xs font-semibold text-[#8d7982]">
                Payload: station 1030 → 1812 · status 880,36,15 · count 24
              </div>
            </div>

            <div className="md:hidden">
              {loading && result.rows.length === 0 ? (
                <div className="p-10 text-center text-sm font-semibold text-[#9f6c7d]">Đang tải dữ liệu FMS...</div>
              ) : rows.length === 0 ? (
                <div className="p-10 text-center text-sm font-semibold text-[#87747c]">Không có dữ liệu FMS.</div>
              ) : (
                <div className="divide-y divide-[#eee5e8]">
                  {rows.map((row) => {
                    const latest = row.latestTrackingEvent;
                    return (
                      <article key={row.shipmentId} className="space-y-4 p-4">
                        <div>
                          <div className="field-label">SPX Tracking Number</div>
                          <div className="mt-1 break-all font-mono text-sm font-black text-[#493a40]">{row.shipmentId}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div><span className="field-label">TO Number</span><div className="field-value">{row.currentToNumber || "—"}</div></div>
                          <div><span className="field-label">Order Status</span><div className="mt-1"><StatusValue status={row.orderStatus} /></div></div>
                          <div><span className="field-label">Bulky Type</span><div className="field-value">{row.bulkyType}</div></div>
                          <div><span className="field-label">Đã qua</span><div className="field-value font-black text-[#9f4664]">{latest ? formatFmsElapsedHours(latest.timestamp, nowMs) : "—"}</div></div>
                        </div>

                        <div>
                          <span className="field-label">Route</span>
                          <div className="field-value">{row.currentStationName || "—"} → {row.nextStationName || "—"}</div>
                        </div>

                        <div className="rounded-xl border border-[#eadde2] bg-[#faf7f8] p-3">
                          <span className="field-label">Trạng thái cuối</span>
                          {row.trackingError ? (
                            <div className="mt-2 text-xs font-semibold text-rose-700">{row.trackingError}</div>
                          ) : latest ? (
                            <div className="mt-2 space-y-2">
                              <StatusValue status={latest.status} />
                              <div className="text-xs font-semibold text-[#75636b]">{formatFmsTimestamp(latest.timestamp)}</div>
                              {(latest.message || latest.stationName) && (
                                <div className="text-xs leading-5 text-[#75636b]">
                                  {latest.message || "—"}{latest.stationName ? ` · ${latest.stationName}` : ""}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="field-value">Không có tracking.</div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="table min-w-[1500px]">
                <thead>
                  <tr className="border-[#eadde2] bg-[#faf7f8] text-[#6f5f66]">
                    <th>SPX Tracking Number</th>
                    <th>TO Number</th>
                    <th>Order Status</th>
                    <th>Bulky Type</th>
                    <th>Current Station</th>
                    <th>Next Station</th>
                    <th>Trạng thái cuối</th>
                    <th>Timestamp</th>
                    <th>Cập nhật cuối</th>
                    <th>Đã qua</th>
                    <th>Message / Station</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && result.rows.length === 0 ? (
                    <tr><td colSpan={11} className="py-12 text-center font-semibold text-[#9f6c7d]">Đang tải dữ liệu FMS...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={11} className="py-12 text-center font-semibold text-[#87747c]">Không có dữ liệu FMS.</td></tr>
                  ) : rows.map((row) => {
                    const latest = row.latestTrackingEvent;
                    return (
                      <tr key={row.shipmentId} className="border-[#eee5e8] align-top hover:bg-[#fcfafb]">
                        <td className="font-mono text-xs font-black text-[#493a40]">{row.shipmentId}</td>
                        <td className="font-mono text-xs font-semibold">{row.currentToNumber || "—"}</td>
                        <td><StatusValue status={row.orderStatus} /></td>
                        <td>{row.bulkyType}</td>
                        <td>{row.currentStationName || "—"}</td>
                        <td>{row.nextStationName || "—"}</td>
                        <td>{latest ? <StatusValue status={latest.status} /> : "—"}</td>
                        <td className="font-mono text-xs font-semibold">{latest?.timestamp || "—"}</td>
                        <td className="whitespace-nowrap text-xs font-semibold">{latest ? formatFmsTimestamp(latest.timestamp) : "—"}</td>
                        <td className="whitespace-nowrap font-black text-[#9f4664]">{latest ? formatFmsElapsedHours(latest.timestamp, nowMs) : "—"}</td>
                        <td className="max-w-[360px] text-xs leading-5">
                          {row.trackingError ? (
                            <span className="font-semibold text-rose-700">{row.trackingError}</span>
                          ) : latest ? (
                            <>{latest.message || "—"}{latest.stationName ? <span className="font-semibold text-[#8f4d63]"> · {latest.stationName}</span> : null}</>
                          ) : "Không có tracking."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#eadde2] p-4 sm:p-5">
              <button
                type="button"
                onClick={() => void loadData(result.pageNo - 1)}
                disabled={loading || result.pageNo <= 1}
                className="btn min-h-10 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-[#6f5f66] shadow-none hover:bg-[#faf4f6]"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>
              <span className="text-xs font-bold text-[#7f6c75]">Trang {result.pageNo} / {pageCount}</span>
              <button
                type="button"
                onClick={() => void loadData(result.pageNo + 1)}
                disabled={loading || result.pageNo >= pageCount}
                className="btn min-h-10 rounded-xl border border-[#e6d9de] bg-white px-4 font-bold text-[#6f5f66] shadow-none hover:bg-[#faf4f6]"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
