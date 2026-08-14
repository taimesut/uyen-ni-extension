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
import { getCookies } from "../utils/config";
import {
  formatFmsTimestamp,
  type FmsOrderRow,
  type FmsResult,
  type FmsTrackingEvent,
} from "../utils/fms";
import { fetchFmsData } from "../utils/fmsApi";

const EMPTY_RESULT: FmsResult = {
  pageNo: 1,
  count: 24,
  total: 0,
  rows: [],
};

interface FlatFmsRow {
  order: FmsOrderRow;
  event: FmsTrackingEvent | null;
  key: string;
}

const TrackingHistory = ({ row }: { row: FmsOrderRow }) => {
  if (row.trackingError) {
    return (
      <div className="text-xs font-semibold leading-5 text-rose-700">
        {row.trackingError}
      </div>
    );
  }

  if (row.trackingEvents.length === 0) {
    return <span className="text-xs font-medium text-[#9a858e]">Không có tracking.</span>;
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {row.trackingEvents.map((event, index) => (
        <div
          key={`${row.shipmentId}-${event.id}-${event.status}-${event.timestamp}-${index}`}
          className="rounded-lg border border-[#eee5e8] bg-[#fcfafb] p-2.5"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-md bg-[#f3e5ea] px-2 py-0.5 font-mono text-xs font-black text-[#9f4664]">
              Status {event.status}
            </span>
            <span className="font-mono text-[0.72rem] font-semibold text-[#695860]">
              {event.timestamp}
            </span>
            <span className="text-[0.72rem] font-medium text-[#8a757e]">
              {formatFmsTimestamp(event.timestamp)}
            </span>
          </div>
          {(event.message || event.stationName) && (
            <div className="mt-1.5 text-xs leading-5 text-[#75636b]">
              {event.message || "—"}
              {event.stationName ? ` · ${event.stationName}` : ""}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const FmsPage = () => {
  const [result, setResult] = useState<FmsResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [cookieAvailable, setCookieAvailable] = useState(() => Boolean(getCookies()));

  const loadData = useCallback(async (pageNo: number) => {
    const cookie = getCookies();
    setCookieAvailable(Boolean(cookie));

    if (!cookie) return;

    setLoading(true);
    try {
      setResult(await fetchFmsData(cookie, pageNo));
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

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return result.rows;

    return result.rows.filter((row) =>
      [
        row.shipmentId,
        row.currentToNumber,
        String(row.orderStatus),
        String(row.bulkyType),
        row.currentStationName,
        row.nextStationName,
        ...row.trackingEvents.flatMap((event) => [
          String(event.status),
          String(event.timestamp),
          event.message,
          event.stationName,
        ]),
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [result.rows, search]);

  const flatRows = useMemo<FlatFmsRow[]>(
    () =>
      rows.flatMap((order) => {
        if (order.trackingEvents.length === 0) {
          return [
            {
              order,
              event: null,
              key: `${order.shipmentId}-empty`,
            },
          ];
        }

        return order.trackingEvents.map((event, index) => ({
          order,
          event,
          key: `${order.shipmentId}-${event.id}-${event.status}-${event.timestamp}-${index}`,
        }));
      }),
    [rows],
  );

  const pageCount = Math.max(1, Math.ceil(result.total / result.count));

  return (
    <div className="app-page space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="soft-kicker">SPX FMS</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#44373d] sm:text-4xl">
            Dữ liệu FMS
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#786970]">
            Lấy đơn từ Pleiku SOC (1030) đi 44-GLI Pleiku 03 Hub (1812), trạng thái 880, 36, 15 và ghép lịch sử status từ tracking detail.
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
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#817078]">Tracking rows</div>
              <div className="mt-3 text-3xl font-black text-[#493a40]">{flatRows.length}</div>
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
                  placeholder="Tìm SPX, TO, status, timestamp, station..."
                />
              </div>
              <div className="text-xs font-semibold text-[#8d7982]">
                Payload cố định: station 1030 → 1812 · status 880,36,15 · count 24
              </div>
            </div>

            <div className="md:hidden">
              {loading && result.rows.length === 0 ? (
                <div className="p-10 text-center text-sm font-semibold text-[#9f6c7d]">Đang tải dữ liệu FMS...</div>
              ) : rows.length === 0 ? (
                <div className="p-10 text-center text-sm font-semibold text-[#87747c]">Không có dữ liệu FMS.</div>
              ) : (
                <div className="divide-y divide-[#eee5e8]">
                  {rows.map((row) => (
                    <article key={row.shipmentId} className="space-y-4 p-4">
                      <div>
                        <div className="field-label">SPX Tracking Number</div>
                        <div className="mt-1 break-all font-mono text-sm font-black text-[#493a40]">{row.shipmentId}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div><span className="field-label">TO Number</span><div className="field-value">{row.currentToNumber || "—"}</div></div>
                        <div><span className="field-label">Order Status</span><div className="field-value font-mono">{row.orderStatus || "—"}</div></div>
                        <div><span className="field-label">Bulky Type</span><div className="field-value">{row.bulkyType}</div></div>
                        <div><span className="field-label">Tracking Events</span><div className="field-value">{row.trackingEvents.length}</div></div>
                      </div>

                      <div>
                        <span className="field-label">Route</span>
                        <div className="field-value">{row.currentStationName || "—"} → {row.nextStationName || "—"}</div>
                      </div>

                      <div>
                        <span className="field-label">Status / Timestamp</span>
                        <div className="mt-2"><TrackingHistory row={row} /></div>
                      </div>
                    </article>
                  ))}
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
                    <th>Tracking Status</th>
                    <th>Timestamp</th>
                    <th>Thời gian</th>
                    <th>Message / Station</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && result.rows.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center font-semibold text-[#9f6c7d]">Đang tải dữ liệu FMS...</td></tr>
                  ) : flatRows.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center font-semibold text-[#87747c]">Không có dữ liệu FMS.</td></tr>
                  ) : flatRows.map(({ order, event, key }) => (
                    <tr key={key} className="border-[#eee5e8] align-top hover:bg-[#fcfafb]">
                      <td className="font-mono text-xs font-black text-[#493a40]">{order.shipmentId}</td>
                      <td className="font-mono text-xs font-semibold">{order.currentToNumber || "—"}</td>
                      <td className="font-mono font-bold">{order.orderStatus || "—"}</td>
                      <td>{order.bulkyType}</td>
                      <td>{order.currentStationName || "—"}</td>
                      <td>{order.nextStationName || "—"}</td>
                      <td>
                        {event ? (
                          <span className="rounded-md bg-[#f3e5ea] px-2 py-1 font-mono text-xs font-black text-[#9f4664]">
                            {event.status}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="font-mono text-xs font-semibold">{event?.timestamp || "—"}</td>
                      <td className="whitespace-nowrap text-xs font-semibold">{event ? formatFmsTimestamp(event.timestamp) : "—"}</td>
                      <td className="max-w-[360px] text-xs leading-5">
                        {order.trackingError ? (
                          <span className="font-semibold text-rose-700">{order.trackingError}</span>
                        ) : event ? (
                          <>
                            {event.message || "—"}
                            {event.stationName ? <span className="font-semibold text-[#8f4d63]"> · {event.stationName}</span> : null}
                          </>
                        ) : "Không có tracking."}
                      </td>
                    </tr>
                  ))}
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
              <span className="text-xs font-bold text-[#7f6c75]">
                Trang {result.pageNo} / {pageCount}
              </span>
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
