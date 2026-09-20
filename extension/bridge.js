(() => {
  "use strict";

  if (window.__SPX_FMS_AUDIT_BRIDGE__) return;
  window.__SPX_FMS_AUDIT_BRIDGE__ = true;

  const SEARCH_URL = "/api/fleet_order/order/tracking_list/search";
  const DETAIL_URL = "/api/fleet_order/order/detail/tracking_info";

  const PAGE_SIZE = 50;
  const MAX_PAGES = 100;
  const PAGE_DELAY_MS = 180;
  const DETAIL_BATCH_SIZE = 5;
  const DETAIL_BATCH_DELAY_MS = 450;

  let activeController = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function post(type, payload = {}) {
    window.postMessage({
      source: "SPX_FMS_AUDIT_BRIDGE",
      type,
      ...payload
    }, window.location.origin);
  }

  function readPageCsrfToken() {
    const parts = String(document.cookie || "").split(";");

    for (const raw of parts) {
      const item = raw.trim();
      const index = item.indexOf("=");
      if (index < 0) continue;

      const key = item.slice(0, index).trim();
      const value = item.slice(index + 1).trim();

      if (key === "csrftoken" || key === "csrf_token") {
        return value;
      }
    }

    return "";
  }

  async function fetchJson(url, options = {}, csrfRetry = false) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      ...(options.headers || {})
    };

    const requestOptions = {
      ...options,
      headers,
      credentials: "include",
      signal: activeController ? activeController.signal : undefined
    };

    let response = await fetch(url, requestOptions);

    if (response.status === 403 && csrfRetry) {
      const csrf = readPageCsrfToken();

      if (csrf) {
        response = await fetch(url, {
          ...requestOptions,
          headers: {
            ...headers,
            "x-csrftoken": csrf
          }
        });
      }
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "SPX từ chối quyền truy cập. Hãy kiểm tra tài khoản đang đăng nhập có quyền xem FMS."
      );
    }

    if (!response.ok) {
      throw new Error(`SPX API lỗi HTTP ${response.status}.`);
    }

    let json;

    try {
      json = await response.json();
    } catch (_) {
      throw new Error("SPX API trả về dữ liệu không phải JSON.");
    }

    if (
      json &&
      typeof json.retcode !== "undefined" &&
      Number(json.retcode) !== 0
    ) {
      throw new Error(json.message || `SPX API retcode ${json.retcode}.`);
    }

    return json;
  }

  function normalizeFilters(raw) {
    const currentStation = String(raw?.current_station_id || "").trim();
    const nextStation = String(raw?.next_station_id || "").trim();

    if (!["1030", "1812"].includes(currentStation)) {
      throw new Error("Current Station không hợp lệ.");
    }

    if (!["1030", "1812"].includes(nextStation)) {
      throw new Error("Next Station không hợp lệ.");
    }

    const source = Array.isArray(raw?.order_status)
      ? raw.order_status
      : String(raw?.order_status || "").split(",");

    const seen = new Set();
    const statuses = [];

    for (const value of source) {
      const code = String(value || "").trim();
      if (!code) continue;

      if (!/^\d+$/.test(code)) {
        throw new Error(`Order Status không hợp lệ: ${code}`);
      }

      if (seen.has(code)) continue;
      seen.add(code);
      statuses.push(code);
    }

    return {
      current_station_id: currentStation,
      next_station_id: nextStation,
      order_status: statuses
    };
  }

  function buildSearchPayload(pageNo, filters) {
    const payload = {
      count: PAGE_SIZE,
      current_station_ids: filters.current_station_id,
      next_station_ids: filters.next_station_id,
      page_no: pageNo
    };

    if (filters.order_status.length) {
      payload.order_status = filters.order_status.join(",");
    }

    return payload;
  }

  async function fetchAllOrders(filters, requestId) {
    const orders = [];
    const seen = new Set();

    let total = 0;
    let rawFetched = 0;
    let pagesFetched = 0;

    for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
      const json = await fetchJson(
        SEARCH_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildSearchPayload(pageNo, filters))
        },
        true
      );

      const data = json?.data || {};
      const pageOrders = Array.isArray(data.list) ? data.list : [];
      const declaredTotal = Number(data.total || 0);

      pagesFetched = pageNo;
      total = Math.max(total, declaredTotal);
      rawFetched += pageOrders.length;

      pageOrders.forEach((order, index) => {
        const shipmentId = String(order?.shipment_id || "").trim();
        const key = shipmentId || `__missing__${pageNo}_${index}`;

        if (seen.has(key)) return;
        seen.add(key);
        orders.push(order);
      });

      post("SPX_FMS_PROGRESS", {
        requestId,
        stage: "search",
        pagesFetched,
        ordersFound: orders.length,
        total: Math.max(total, orders.length)
      });

      const hasMoreByTotal = total > rawFetched;
      const hasMoreWithoutTotal =
        total <= 0 && pageOrders.length >= PAGE_SIZE;

      const shouldContinue =
        pageOrders.length > 0 &&
        (hasMoreByTotal || hasMoreWithoutTotal);

      if (!shouldContinue) {
        return {
          orders,
          total: Math.max(total, orders.length),
          pagesFetched
        };
      }

      if (pageNo < MAX_PAGES) {
        await sleep(PAGE_DELAY_MS);
      }
    }

    throw new Error(`FMS search vượt quá ${MAX_PAGES} trang.`);
  }

  function findLatestTracking(items, latest = null) {
    if (!Array.isArray(items)) return latest;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const candidate = {
        id: Number(item.id || 0),
        status: Number(item.status || 0),
        timestamp: Number(item.timestamp || 0),
        message: String(item.message || ""),
        station_name: String(item.station_name || "")
      };

      if (
        !latest ||
        candidate.timestamp > Number(latest.timestamp || 0)
      ) {
        latest = candidate;
      }

      latest = findLatestTracking(item.children, latest);
      latest = findLatestTracking(item.event_children, latest);
    }

    return latest;
  }

  async function fetchDetail(order) {
    const shipmentId = String(order?.shipment_id || "").trim();

    if (!shipmentId) {
      return {
        order,
        latest_tracking_event: null,
        tracking_error: "Thiếu shipment_id."
      };
    }

    try {
      const json = await fetchJson(
        `${DETAIL_URL}?shipment_id=${encodeURIComponent(shipmentId)}`,
        { method: "GET" },
        false
      );

      const trackingList = Array.isArray(json?.data?.tracking_list)
        ? json.data.tracking_list
        : [];

      return {
        order,
        latest_tracking_event: findLatestTracking(trackingList, null),
        tracking_error: ""
      };
    } catch (error) {
      if (error?.name === "AbortError") throw error;

      return {
        order,
        latest_tracking_event: null,
        tracking_error: String(error?.message || error || "")
      };
    }
  }

  function buildRow(entry) {
    const order = entry.order || {};

    return {
      shipment_id: String(order.shipment_id || ""),
      current_to_number: String(order.current_to_number || ""),
      order_status: Number(order.order_status || 0),
      bulky_type: Number(order.bulky_type || 0),
      current_station_name: String(order.current_station_name || ""),
      next_station_name: String(order.next_station_name || ""),
      latest_tracking_event: entry.latest_tracking_event,
      tracking_error: entry.tracking_error || ""
    };
  }

  async function fetchDetails(orders, requestId) {
    const rows = [];

    for (let start = 0; start < orders.length; start += DETAIL_BATCH_SIZE) {
      const batch = orders.slice(start, start + DETAIL_BATCH_SIZE);
      const result = await Promise.all(batch.map(fetchDetail));

      rows.push(...result.map(buildRow));

      post("SPX_FMS_PROGRESS", {
        requestId,
        stage: "detail",
        completed: Math.min(start + batch.length, orders.length),
        total: orders.length
      });

      if (start + batch.length < orders.length) {
        await sleep(DETAIL_BATCH_DELAY_MS);
      }
    }

    return rows;
  }

  async function runFetch(requestId, rawFilters) {
    activeController?.abort();
    activeController = new AbortController();

    try {
      const filters = normalizeFilters(rawFilters);

      post("SPX_FMS_PROGRESS", {
        requestId,
        stage: "start"
      });

      const searchResult = await fetchAllOrders(filters, requestId);
      const rows = await fetchDetails(searchResult.orders, requestId);

      post("SPX_FMS_RESULT", {
        requestId,
        result: {
          rows,
          total: Math.max(searchResult.total, rows.length),
          pages_fetched: searchResult.pagesFetched,
          filters
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        post("SPX_FMS_CANCELLED", { requestId });
      } else {
        post("SPX_FMS_ERROR", {
          requestId,
          message: String(error?.message || error || "Không thể tải FMS.")
        });
      }
    } finally {
      activeController = null;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const data = event.data;
    if (!data || data.source !== "SPX_FMS_AUDIT_UI") return;

    if (data.type === "SPX_FMS_PING") {
      post("SPX_FMS_BRIDGE_READY");
      return;
    }

    if (data.type === "SPX_FMS_FETCH") {
      runFetch(data.requestId, data.filters || {});
      return;
    }

    if (data.type === "SPX_FMS_CANCEL") {
      activeController?.abort();
    }
  });

  post("SPX_FMS_BRIDGE_READY");
})();