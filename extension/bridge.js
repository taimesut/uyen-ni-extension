(() => {
  "use strict";

  if (window.__SPX_FMS_AUDIT_BRIDGE__) return;
  window.__SPX_FMS_AUDIT_BRIDGE__ = true;

  const SEARCH_URL = "/api/fleet_order/order/tracking_list/search";
  const DETAIL_URL = "/api/fleet_order/order/detail/tracking_info";
  const PICKUP_SEARCH_URL = "/api/admin/pickup/fm_hub/pickup_order/search";
  const PICKUP_SENSITIVE_URL = "/api/fleet_order/order/detail/show_sensitive_data";
  const PICKUP_INFO_URL = "/api/admin/pickup/order/detail/pickup_info";

  const PAGE_SIZE = 50;
  const MAX_PAGES = 100;
  const PAGE_DELAY_MS = 180;
  const DETAIL_BATCH_SIZE = 5;
  const DETAIL_BATCH_DELAY_MS = 450;

  let activeController = null;
  let deliveryController = null;
  let pickupController = null;

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

  async function fetchDeliveryJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json, text/plain, */*",
        ...(options.headers || {})
      },
      signal: deliveryController ? deliveryController.signal : undefined
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "SPX từ chối quyền truy cập Delivery Performance. Hãy kiểm tra tài khoản đang đăng nhập."
      );
    }

    if (!response.ok) {
      throw new Error(`Delivery Performance API lỗi HTTP ${response.status}.`);
    }

    let json;
    try {
      json = await response.json();
    } catch (_) {
      throw new Error("Delivery Performance API trả về dữ liệu không phải JSON.");
    }

    if (
      json &&
      typeof json.retcode !== "undefined" &&
      Number(json.retcode) !== 0
    ) {
      throw new Error(json.message || `Delivery Performance retcode ${json.retcode}.`);
    }

    return json;
  }


  async function fetchPickupJson(url, options = {}) {
    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          ...options,
          credentials:"include",
          headers:{
            Accept:"application/json, text/plain, */*",
            ...(options.headers || {})
          },
          signal:pickupController ? pickupController.signal : undefined
        });

        if ((response.status === 429 || response.status === 503) && attempt < maxAttempts) {
          await sleep(500 * attempt);
          continue;
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error("SPX từ chối quyền truy cập Pickup Assignment. Hãy kiểm tra tài khoản đang đăng nhập.");
        }

        if (!response.ok) {
          throw new Error(`Pickup Assignment API lỗi HTTP ${response.status}.`);
        }

        let json;
        try {
          json = await response.json();
        } catch (_) {
          throw new Error("Pickup Assignment API trả về dữ liệu không phải JSON.");
        }

        if (json && typeof json.retcode !== "undefined" && Number(json.retcode) !== 0) {
          throw new Error(json.message || `Pickup Assignment retcode ${json.retcode}.`);
        }

        return json;
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        lastError = error;
        if (attempt < maxAttempts) {
          await sleep(350 * attempt);
          continue;
        }
      }
    }

    throw lastError || new Error("Không thể gọi Pickup Assignment API.");
  }

  function localDateEpoch(value, endOfDay = false) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new Error("Khoảng ngày Pickup Assignment không hợp lệ.");

    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      0
    );

    const ts = Math.floor(date.getTime() / 1000);
    if (!Number.isFinite(ts)) throw new Error("Không thể chuyển khoảng ngày Pickup Assignment.");
    return ts;
  }

  async function fetchPickupAssignmentOrders(requestId, startTs, endTs) {
    const makeUrl = (page) =>
      PICKUP_SEARCH_URL +
      `?ctime=${startTs},${endTs}&status=2&pageno=${page}&count=50&fetch_total=0`;

    const firstJson = await fetchPickupJson(makeUrl(1), {method:"GET"});
    const firstData = firstJson?.data || {};
    const assignedCount = Math.max(0, Number(firstData.assigned_count || 0));
    const unique = new Map();

    for (const item of Array.isArray(firstData.list) ? firstData.list : []) {
      const id = String(item?.pickup_order_id || "");
      if (id && !unique.has(id)) unique.set(id, item);
    }

    let pagesFetched = 1;
    const maxPages = Math.max(1, Math.min(100, Math.ceil(assignedCount / 50)));

    post("SPX_PICKUP_ASSIGNMENT_PROGRESS", {
      requestId,
      stage:"search",
      ordersFound:Math.min(unique.size, assignedCount),
      total:assignedCount,
      pagesFetched
    });

    for (let page = 2; page <= maxPages && unique.size < assignedCount; page += 1) {
      const json = await fetchPickupJson(makeUrl(page), {method:"GET"});
      const list = Array.isArray(json?.data?.list) ? json.data.list : [];

      for (const item of list) {
        const id = String(item?.pickup_order_id || "");
        if (id && !unique.has(id)) unique.set(id, item);
      }

      pagesFetched = page;
      post("SPX_PICKUP_ASSIGNMENT_PROGRESS", {
        requestId,
        stage:"search",
        ordersFound:Math.min(unique.size, assignedCount),
        total:assignedCount,
        pagesFetched
      });

      if (!list.length) break;
      await sleep(120);
    }

    return {
      assignedCount,
      pagesFetched,
      orders:Array.from(unique.values()).slice(0, assignedCount)
    };
  }

  async function fetchPickupAddress(order) {
    const shipmentId = String(order?.pickup_order_id || "");
    if (!shipmentId) return "";

    const dataField = Number(order?.pickup_order_type || 0) === 5
      ? "buyer_addr"
      : "seller_addr";

    const url =
      PICKUP_SENSITIVE_URL +
      `?shipment_id=${encodeURIComponent(shipmentId)}&data_field=${encodeURIComponent(dataField)}`;

    const json = await fetchPickupJson(url, {method:"GET"});
    return String(json?.data?.data_detail || "");
  }

  function pickLatestDriver(json) {
    const infoList = Array.isArray(json?.data?.pickup_info_list)
      ? json.data.pickup_info_list
      : [];
    const events = [];

    for (const info of infoList) {
      for (const tracking of Array.isArray(info?.pickup_order_tracking) ? info.pickup_order_tracking : []) {
        const name = String(tracking?.pickup_driver_name || "").trim();
        if (!name) continue;

        events.push({
          name,
          ctime:Number(tracking?.ctime || 0),
          remark:String(tracking?.remark || ""),
          status:String(tracking?.pickup_result || info?.pickup_status || ""),
          reason:String(tracking?.on_hold_reason || "")
        });
      }
    }

    events.sort((a, b) => b.ctime - a.ctime);
    if (events.length) return events[0];

    for (const info of infoList) {
      const names = Array.isArray(info?.driver_name) ? info.driver_name : [];
      const name = String(names[0] || "").trim();
      if (!name) continue;

      return {
        name,
        ctime:Number(info?.assigned_time || 0),
        remark:"",
        status:String(info?.pickup_status || ""),
        reason:""
      };
    }

    return {name:"", ctime:0, remark:"", status:"", reason:""};
  }

  async function fetchPickupDriver(shipmentId) {
    const url =
      PICKUP_INFO_URL +
      `?shipment_id=${encodeURIComponent(shipmentId)}&station_type=12`;
    const json = await fetchPickupJson(url, {method:"GET"});
    return pickLatestDriver(json);
  }

  async function enrichPickupAssignmentOrders(orders, requestId) {
    const source = Array.isArray(orders) ? orders : [];
    const rows = [];
    const batchSize = 4;

    for (let offset = 0; offset < source.length; offset += batchSize) {
      const batch = source.slice(offset, offset + batchSize);

      const enriched = await Promise.all(batch.map(async (order) => {
        const shipmentId = String(order?.pickup_order_id || "");
        let address = "";
        let addressError = "";
        let driver = {name:"", ctime:0, remark:"", status:"", reason:""};
        let driverError = "";

        try {
          address = await fetchPickupAddress(order);
        } catch (error) {
          if (error?.name === "AbortError") throw error;
          addressError = String(error?.message || error || "Không lấy được địa chỉ.");
        }

        try {
          driver = await fetchPickupDriver(shipmentId);
        } catch (error) {
          if (error?.name === "AbortError") throw error;
          driverError = String(error?.message || error || "Không lấy được tài xế.");
        }

        return {
          pickup_order_id:shipmentId,
          eta:Number(order?.eta || 0),
          pickup_attempts:Number(order?.pickup_attempts || 0),
          pickup_order_type:Number(order?.pickup_order_type || 0),
          pickup_point_name:String(order?.pickup_point_name || ""),
          pickup_station_name:String(order?.pickup_station_name || ""),
          fo_service_type_name:String(order?.fo_service_type_name || ""),
          on_hold_reason_name:String(order?.on_hold_reason_name || ""),
          address,
          address_error:addressError,
          driver_name:String(driver.name || ""),
          driver_ctime:Number(driver.ctime || 0),
          driver_remark:String(driver.remark || ""),
          driver_status:String(driver.status || ""),
          driver_reason:String(driver.reason || ""),
          driver_error:driverError
        };
      }));

      rows.push(...enriched);

      post("SPX_PICKUP_ASSIGNMENT_PROGRESS", {
        requestId,
        stage:"detail",
        completed:rows.length,
        total:source.length
      });

      if (offset + batchSize < source.length) await sleep(180);
    }

    return rows;
  }

  async function runPickupAssignment(requestId, rawRange) {
    pickupController?.abort();
    pickupController = new AbortController();

    try {
      const startTs = localDateEpoch(rawRange?.startDate, false);
      const endTs = localDateEpoch(rawRange?.endDate, true);

      if (startTs > endTs) {
        throw new Error("Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.");
      }

      const searchResult = await fetchPickupAssignmentOrders(requestId, startTs, endTs);
      const rows = await enrichPickupAssignmentOrders(searchResult.orders, requestId);

      post("SPX_PICKUP_ASSIGNMENT_RESULT", {
        requestId,
        result:{
          assigned_count:searchResult.assignedCount,
          pages_fetched:searchResult.pagesFetched,
          rows
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        post("SPX_PICKUP_ASSIGNMENT_CANCELLED", {requestId});
      } else {
        post("SPX_PICKUP_ASSIGNMENT_ERROR", {
          requestId,
          message:String(error?.message || error || "Không thể tải Pickup Assignment.")
        });
      }
    } finally {
      pickupController = null;
    }
  }

  async function findDeliveryExportTask(taskId, requestId) {
    const startTime = Math.floor(Date.now() / 1000) - 86400;
    const maxAttempts = 60;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      for (let page = 1; page <= 3; page += 1) {
        const listUrl =
          "/spxdata/api/export_platform/export_task/list_for_portal" +
          `?start_time=${startTime}&count=100&pageno=${page}`;

        const json = await fetchDeliveryJson(listUrl, { method: "GET" });
        const data = json?.data || {};
        const tasks = Array.isArray(data.task_list) ? data.task_list : [];
        const task = tasks.find((item) => Number(item?.task_id) === Number(taskId));

        if (task) {
          if (task.failed_reason) {
            throw new Error(`Export thất bại: ${task.failed_reason}`);
          }

          const fileName = String(task.file_name || "").trim();
          const ready = Number(task.export_status) === 2 && /^\/?downloads\//.test(fileName);

          if (ready) return task;

          break;
        }

        const total = Number(data.total || 0);
        if (page * 100 >= total) break;
      }

      post("SPX_DELIVERY_EXPORT_PROGRESS", {
        requestId,
        stage: "poll",
        attempt,
        maxAttempts,
        taskId
      });

      await sleep(1500);
    }

    throw new Error("Quá thời gian chờ file Delivery Performance được tạo.");
  }

  async function downloadDeliveryCsv(task, requestId) {
    const fileName = String(task?.file_name || "").trim();
    if (!fileName) throw new Error("Export task chưa có file_name.");

    const normalizedPath = "/" + fileName.replace(/^\/+/, "");

    post("SPX_DELIVERY_EXPORT_PROGRESS", {
      requestId,
      stage: "download",
      taskId: Number(task.task_id || 0),
      fileName
    });

    const response = await fetch(normalizedPath, {
      method: "GET",
      credentials: "include",
      signal: deliveryController ? deliveryController.signal : undefined
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Không có quyền tải file Delivery Performance.");
    }

    if (!response.ok) {
      throw new Error(`Tải CSV thất bại (HTTP ${response.status}).`);
    }

    return await response.text();
  }

  async function runDeliveryExport(requestId, rawDate) {
    deliveryController?.abort();
    deliveryController = new AbortController();

    try {
      const startDate = String(rawDate || "").trim();

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error("Ngày export không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD.");
      }

      post("SPX_DELIVERY_EXPORT_PROGRESS", {
        requestId,
        stage: "create",
        startDate
      });

      const createUrl =
        "/api/driverservice/admin/performance/delivery/export/list" +
        `?function_type=0&frequency=1&start_date=${encodeURIComponent(startDate)}`;

      const created = await fetchDeliveryJson(createUrl, { method: "GET" });
      const taskId = Number(created?.data?.task_id || created?.data?.fms_task_id || 0);

      if (!taskId) {
        throw new Error("SPX không trả về task_id cho Delivery Performance.");
      }

      post("SPX_DELIVERY_EXPORT_PROGRESS", {
        requestId,
        stage: "task-created",
        taskId,
        startDate
      });

      const task = await findDeliveryExportTask(taskId, requestId);
      const csvText = await downloadDeliveryCsv(task, requestId);

      post("SPX_DELIVERY_EXPORT_RESULT", {
        requestId,
        result: {
          task_id: taskId,
          station_id: Number(task.station_id || 0),
          station_name: String(task.station_name || ""),
          file_name: String(task.file_name || ""),
          start_date: startDate,
          csv_text: csvText
        }
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        post("SPX_DELIVERY_EXPORT_CANCELLED", { requestId });
      } else {
        post("SPX_DELIVERY_EXPORT_ERROR", {
          requestId,
          message: String(error?.message || error || "Không thể export Delivery Performance.")
        });
      }
    } finally {
      deliveryController = null;
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
      return;
    }

    if (data.type === "SPX_PICKUP_ASSIGNMENT_FETCH") {
      runPickupAssignment(data.requestId, data.range || {});
      return;
    }

    if (data.type === "SPX_PICKUP_ASSIGNMENT_CANCEL") {
      pickupController?.abort();
      return;
    }

    if (data.type === "SPX_DELIVERY_EXPORT_RUN") {
      runDeliveryExport(data.requestId, data.startDate);
      return;
    }

    if (data.type === "SPX_DELIVERY_EXPORT_CANCEL") {
      deliveryController?.abort();
    }
  });

  post("SPX_FMS_BRIDGE_READY");
})();