// ==UserScript==
// @name         SPX Operations Tools - Safari
// @namespace    https://github.com/taimesut/uyen-ni-extension
// @version      2.1.2.0
// @description  FMS, Pickup, Delivery Performance ngày/tháng và SeaTalk trực tiếp trên SPX.
// @author       taimesut
// @match        https://spx.shopee.vn/*
// @run-at       document-idle
// @noframes
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.xmlHttpRequest
// @connect      openapi.seatalk.io
// @connect      spx.shopee.vn
// @icon         https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/extension/icons/icon-48.png
// @downloadURL  https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.user.js
// @updateURL    https://raw.githubusercontent.com/taimesut/uyen-ni-extension/main/userscript/spx-operations-tools-safari.user.js
// ==/UserScript==



(() => {
  "use strict";

  // Safari Userscripts compatibility layer.
  // The extension UI expects chrome.storage.local + chrome.runtime.sendMessage.
  // This userscript maps those calls to GM APIs so the same UI/business logic can run unchanged.

  const GM_API = globalThis.GM || {};

  function normalizeKeys(keys) {
    if (Array.isArray(keys)) return keys;
    if (typeof keys === "string") return [keys];
    if (keys && typeof keys === "object") return Object.keys(keys);
    return [];
  }

  async function gmGetValue(key, defaultValue) {
    if (typeof GM_API.getValue === "function") {
      return GM_API.getValue(key, defaultValue);
    }

    try {
      const raw = localStorage.getItem("__spx_userscript_" + key);
      return raw == null ? defaultValue : JSON.parse(raw);
    } catch (_) {
      return defaultValue;
    }
  }

  async function gmSetValue(key, value) {
    if (typeof GM_API.setValue === "function") {
      return GM_API.setValue(key, value);
    }

    localStorage.setItem(
      "__spx_userscript_" + key,
      JSON.stringify(value)
    );
  }

  async function gmDeleteValue(key) {
    if (typeof GM_API.deleteValue === "function") {
      return GM_API.deleteValue(key);
    }

    localStorage.removeItem("__spx_userscript_" + key);
  }

  const runtime = {
    lastError: null,

    getURL(path) {
      const value = String(path || "");
      if (/^icons\/icon-(?:16|32|48|128)\.png$/i.test(value)) {
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAHRUlEQVR4nO2Ze4xVVxXGf2ufc98zA5Q20xbQTDUxkAhStU2pUJNGgtiWQKTGVimQalJsSZFKMLFa0VgFahoftVLQglZQMVABFQ0NNSViBaWJ0IqUYg1asDyGmfs4956zl3/sc2fuwGVm7swAIWH9ce/JeezzfXuv9e211pGTd75XuYzNXGoAg7UrBC61XSFwqe2yJ+AP6mmR+ue1AWUWAQXOHkoBbJ0LPW0ABMQNHIZ1r6laJJnqP4lKue5pVUUSyT4fb4yAMRCU8N8/Gf/GSVAOalZBQTz0xDGCrevB93snYQwEAcmpszCj2yAKu8dSRTJZolf3Ud65DVLp847V8AqoCPbYUdJTZyFNw+reY48eofyXF5FMDqw99wbPR8+cJHnbHeQWLgPPO/c9b79Fx45fo8br1YkaC2JrkVSa6NB+ij9f5fw0ihxIG7uVKpn5i5GWEe7a2XFiPLRUIDHxVnKLvu7Ah6F7PnL/tv0UHcseIty/17lRLyvZuApFEdLcQnn7RqI3DzkAIs4lPA9QvBvGkpoyHe08A6Zmdo2BUgGvdRS5L6xAmoc7cL4PRkAMqKX44ycID+xFho0ArbOCgyIAYDxs+0mKz30PIkssGbGiuOPUzPswY9rQcskBNwatlKF5GNkHH8O0Xu9mvcbvMYbCj1YSbNuANLVAGPUNZUAEVJFUmsqfdlD56y43c1HURQ61eKPbyMycGxMEKmXET5BbuIzEByaDjRwxiIkYghe2EGxai2Sycez0rWQDJoDno+USxV/8EC0WHJiqr8aukJw2G290m1MrP0n64/eTnDzN+XrVtawFY6i8vJPCU8u6XbKfNvCdOIqQTI7wld2Ud26t81JBMjky8xa5FRs2gvTs+2NXqYJ3qxD965/kVy5F853g9SG/Q0YAQC2SSFLauAYt5OuQUJKTPkLiltuJjhwk2LY+jhPbRcSePkHhyUexp08g6XR92b1wBIBEEnv0DYobfuDOVQGIOP8XITVjDibXQmnTWuzx/3bFiZZL5FcsobJ/D5Jr7o6ji0agysNPUP7dL4lef83Fgo2BeB5YS2LCzaTvvJfojX9Q2rgmfrNHcd13qLz8RyTb7OJiADZ4Ata5kT35P0rPr4sTM6kJaHecuvszeGPaCH67gej1AwTb1hNsXINkMn1q/YUlUCWRbaa843kqf4tltZYAYK5uJT1zHtp+msKqxymuXuECtpbsAGxoCKjGSaql8Oy30VKxW+Or19WSuutT+DdNobJnF6q274SvHzZ0BY0xqA3xWkchfp0cUQzacRptP4Wk0u7cIMHDUBEwHprvwL9hHLkFXwE/0Q0uThG00Enhqa8RHjoA6Ux/Ntn+vXrQI4hBwzLmmuvILX4cGTGyJsdRRyCKKDz9DYIdm0m8Zzy5z30ZfG9QwTs0BETARghC05KVeO8e1zXjgNN1Yyht+SnBbzZgWkeT+exSkrfPIDlpahwr59YCF4eACFiLhmWy8xfjT7j5rOzSgucT/GETxdUrkGSa3MKvkrjxVrCWzCcfwIxshbDsVOuiEhD3o2GFzL0Pkpo1z21eVfBxdhkdfpXiqm+ixU5Ss+aRnDI9dhvFXP8O0jPmoKVCT8W6KASMj+Y7SE6eRuaeBTF407UqGIP992Hyy5dgTxwnddenyc59uKZCize3j96N1zZ2UCQaf8pzipN43y1kFzzqfLgKXh14PXOK/IolhEcOIokE/tgJTpkk7p/EYGX4VaTveQCpEr/gBIxBCwW8Ue8kt3QlZniN4mgMzloKzyyn8vc9mFwzKkKw6SdoR7sjW5vsoaQ+fAf+uIlojw7HhSAgAlGINDWTfegxzNXXdrkL4GZfhMIz3yLYvhFpGYFWAiSTJTz4CqWtP3MEa0FaBREycxYhnl9D7EIQiPXcKcmHuiQSiI89gt//itLmuCTUuKsWRUi2iWDzOuyxo91jVcGqxR//QVLTZp/bBBgSAnHHQYt5UjPnkbztY7FE1pSEnke49yWKq5d3l4S1aYLxsKffpvjc9+tmqgCp6Z/AXHUNWgkaCui+7zQGLeRJz5hDdv7ne/Z64k3LvnWUzie+iO1oR/xE3YCUZJryi9sI9+12AGubANbivWssqRlzkLi3NDQEjEHbT5EYfxOZ+Y90bzhWu1qB2n6K/Mol2JPHkVSmvpqogp9A8x2UNq2NZZeuRpYbMyI9cy7mujGuX9rPWDg/ARG0HOBPnETTl76LZHPdzStjXFcirNC5/BEq+3bHrZBeSsIoRJpaKP/5BcovbXcz7/ldPSOMh+SayNz3MHpWLdGb9dobFWvxrh1FsHOLy1t6uI5HdPg1wr27kKZ+1rOqiOdRfPZJov+82bMVo06RKBYww0c62a3TMz0HY5+fWVXRsOI2mzrXaKSVDrEcR+dfLZGe6Xgf1nd3WgRJpM7/naHRokTVzez5Zle1oTH72V7XIStA3HBDN9hl/43sCoFLbVcIXGob3HfiBmyIdazL/g/rcy3W/HATZAAAAABJRU5ErkJggg==";
      }
      try {
        return new URL(value, window.location.href).href;
      } catch (_) {
        return value;
      }
    },

    sendMessage(message, callback) {
      runtime.lastError = null;

      if (message?.type !== "SEATALK_SEND_IMAGE") {
        callback?.({
          ok: false,
          error: "Unsupported userscript message."
        });
        return;
      }

      const webhook = String(message.webhook || "").trim();
      const imageBase64 = String(message.imageBase64 || "").trim();

      let parsed;
      try {
        parsed = new URL(webhook);
      } catch (_) {
        callback?.({
          ok: false,
          error: "SeaTalk Webhook không hợp lệ."
        });
        return;
      }

      if (
        parsed.protocol !== "https:" ||
        parsed.hostname !== "openapi.seatalk.io" ||
        !parsed.pathname.startsWith("/webhook/group/")
      ) {
        callback?.({
          ok: false,
          error: "SeaTalk Webhook không hợp lệ."
        });
        return;
      }

      if (!imageBase64) {
        callback?.({
          ok: false,
          error: "Ảnh report đang trống."
        });
        return;
      }

      if (
        new TextEncoder().encode(imageBase64).length >
        5 * 1024 * 1024
      ) {
        callback?.({
          ok: false,
          error: "Ảnh report vượt giới hạn 5MB Base64 của SeaTalk."
        });
        return;
      }

      if (typeof GM_API.xmlHttpRequest !== "function") {
        callback?.({
          ok: false,
          error:
            "Userscript manager không hỗ trợ GM.xmlHttpRequest. " +
            "Hãy dùng Safari Userscripts bản mới."
        });
        return;
      }

      GM_API.xmlHttpRequest({
        method: "POST",
        url: webhook,
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify({
          tag: "image",
          image_base64: {
            content: imageBase64
          }
        }),
        timeout: 30000,

        onload(response) {
          let payload = null;

          try {
            payload = response.responseText
              ? JSON.parse(response.responseText)
              : null;
          } catch (_) {}

          if (
            response.status < 200 ||
            response.status >= 300
          ) {
            callback?.({
              ok: false,
              error:
                payload?.message ||
                payload?.msg ||
                "SeaTalk HTTP " + response.status
            });
            return;
          }

          const code =
            payload?.code ??
            payload?.retcode ??
            payload?.errcode;

          if (
            code != null &&
            Number(code) !== 0
          ) {
            callback?.({
              ok: false,
              error:
                payload?.message ||
                payload?.msg ||
                "SeaTalk error code " + code
            });
            return;
          }

          callback?.({
            ok: true,
            result:
              payload || {
                success: true
              }
          });
        },

        onerror() {
          callback?.({
            ok: false,
            error: "Không thể kết nối SeaTalk webhook."
          });
        },

        ontimeout() {
          callback?.({
            ok: false,
            error: "SeaTalk webhook timeout."
          });
        }
      });
    }
  };

  const storageLocal = {
    get(keys, callback) {
      Promise.resolve()
        .then(async () => {
          const result = {};

          if (
            keys &&
            typeof keys === "object" &&
            !Array.isArray(keys)
          ) {
            for (const key of Object.keys(keys)) {
              result[key] = await gmGetValue(
                key,
                keys[key]
              );
            }
          } else {
            for (const key of normalizeKeys(keys)) {
              result[key] = await gmGetValue(
                key,
                undefined
              );
            }
          }

          runtime.lastError = null;
          callback?.(result);
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.({});
          runtime.lastError = null;
        });
    },

    set(items, callback) {
      Promise.resolve()
        .then(async () => {
          for (
            const [key, value]
            of Object.entries(items || {})
          ) {
            await gmSetValue(key, value);
          }

          runtime.lastError = null;
          callback?.();
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.();
          runtime.lastError = null;
        });
    },

    remove(keys, callback) {
      Promise.resolve()
        .then(async () => {
          for (
            const key
            of normalizeKeys(keys)
          ) {
            await gmDeleteValue(key);
          }

          runtime.lastError = null;
          callback?.();
        })
        .catch(error => {
          runtime.lastError = {
            message: String(
              error?.message ||
              error
            )
          };

          callback?.();
          runtime.lastError = null;
        });
    }
  };

  const existingChrome =
    globalThis.chrome &&
    typeof globalThis.chrome === "object"
      ? globalThis.chrome
      : {};

  existingChrome.storage =
    existingChrome.storage || {};

  existingChrome.storage.local =
    storageLocal;

  existingChrome.runtime =
    runtime;

  try {
    globalThis.chrome =
      existingChrome;
  } catch (_) {
    Object.defineProperty(
      globalThis,
      "chrome",
      {
        value: existingChrome,
        configurable: true
      }
    );
  }
})();

// ---- SPX same-origin API bridge ----

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
  let deliveryMonthController = null;
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
      signal: options.signal || (deliveryController ? deliveryController.signal : undefined)
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
    const shipmentId = String(order?.pickup_order_id || "").trim();
    if (!shipmentId) return "";

    const pickupOrderType = Number(order?.pickup_order_type);
    let dataField = "";

    if (pickupOrderType === 0) {
      dataField = "seller_addr";
    } else if (pickupOrderType === 5) {
      dataField = "buyer_addr";
    } else {
      throw new Error(
        "Không hỗ trợ pickup_order_type=" + String(order?.pickup_order_type ?? "")
      );
    }

    const url =
      PICKUP_SENSITIVE_URL +
      `?shipment_id=${encodeURIComponent(shipmentId)}&data_field=${encodeURIComponent(dataField)}`;

    const json = await fetchPickupJson(url, {method:"GET"});
    return String(json?.data?.data_detail || "").trim();
  }

  function pickLatestDriver(json) {
    const infoList = Array.isArray(json?.data?.pickup_info_list)
      ? json.data.pickup_info_list
      : [];
    const nowTs = Math.floor(Date.now() / 1000);
    const events = [];

    for (const info of infoList) {
      for (const tracking of Array.isArray(info?.pickup_order_tracking) ? info.pickup_order_tracking : []) {
        const name = String(tracking?.pickup_driver_name || "").trim();
        const ctime = Number(tracking?.ctime || 0);

        if (!name || !Number.isFinite(ctime) || ctime <= 0) continue;

        events.push({
          name,
          ctime,
          distanceToNow:Math.abs(nowTs - ctime),
          remark:String(tracking?.remark || ""),
          status:String(tracking?.pickup_result || info?.pickup_status || ""),
          reason:String(tracking?.on_hold_reason || "")
        });
      }
    }

    events.sort((a, b) =>
      a.distanceToNow - b.distanceToNow ||
      b.ctime - a.ctime
    );

    if (events.length) {
      const {distanceToNow, ...driver} = events[0];
      return driver;
    }

    const fallbackDrivers = [];

    for (const info of infoList) {
      const names = Array.isArray(info?.driver_name) ? info.driver_name : [];
      const name = String(names[0] || "").trim();
      const ctime = Number(info?.assigned_time || 0);

      if (!name) continue;

      fallbackDrivers.push({
        name,
        ctime:Number.isFinite(ctime) ? ctime : 0,
        distanceToNow:Number.isFinite(ctime) && ctime > 0
          ? Math.abs(nowTs - ctime)
          : Number.POSITIVE_INFINITY,
        remark:"",
        status:String(info?.pickup_status || ""),
        reason:""
      });
    }

    fallbackDrivers.sort((a, b) =>
      a.distanceToNow - b.distanceToNow ||
      b.ctime - a.ctime
    );

    if (fallbackDrivers.length) {
      const {distanceToNow, ...driver} = fallbackDrivers[0];
      return driver;
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

  async function enrichPickupAssignmentOrders(orders, requestId, addressCache={}) {
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

        const cachedAddress = String(addressCache?.[shipmentId] || "").trim();
        if (cachedAddress) {
          address = cachedAddress;
        } else {
          try {
            address = await fetchPickupAddress(order);
          } catch (error) {
            if (error?.name === "AbortError") throw error;
            addressError = String(error?.message || error || "Không lấy được địa chỉ.");
          }
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

  async function runPickupAssignment(requestId, rawRange, addressCache={}) {
    pickupController?.abort();
    pickupController = new AbortController();

    try {
      const startTs = localDateEpoch(rawRange?.startDate, false);
      const endTs = localDateEpoch(rawRange?.endDate, true);

      if (startTs > endTs) {
        throw new Error("Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.");
      }

      const searchResult = await fetchPickupAssignmentOrders(requestId, startTs, endTs);
      const rows = await enrichPickupAssignmentOrders(searchResult.orders, requestId, addressCache);

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

  async function findDeliveryExportTask(taskId, requestId, reportType, controller) {
    const startTime = Math.floor(Date.now() / 1000) - 86400;
    const maxAttempts = 60;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      for (let page = 1; page <= 3; page += 1) {
        const listUrl =
          "/spxdata/api/export_platform/export_task/list_for_portal" +
          `?start_time=${startTime}&count=100&pageno=${page}`;

        const json = await fetchDeliveryJson(listUrl, { method: "GET", signal:controller?.signal });
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
        reportType,
        stage: "poll",
        attempt,
        maxAttempts,
        taskId
      });

      await sleep(1500);
    }

    throw new Error("Quá thời gian chờ file Delivery Performance được tạo.");
  }

  async function downloadDeliveryCsv(task, requestId, reportType, controller) {
    const fileName = String(task?.file_name || "").trim();
    if (!fileName) throw new Error("Export task chưa có file_name.");

    const normalizedPath = "/" + fileName.replace(/^\/+/, "");

    post("SPX_DELIVERY_EXPORT_PROGRESS", {
      requestId,
      reportType,
      stage: "download",
      taskId: Number(task.task_id || 0),
      fileName
    });

    const response = await fetch(normalizedPath, {
      method: "GET",
      credentials: "include",
      signal: controller?.signal
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Không có quyền tải file Delivery Performance.");
    }

    if (!response.ok) {
      throw new Error(`Tải CSV thất bại (HTTP ${response.status}).`);
    }

    return await response.text();
  }

  async function runDeliveryExport(requestId, rawDate, frequency=1, reportType="day") {
    const isMonthly = reportType === "month";
    const controller = new AbortController();
    if (isMonthly) {
      deliveryMonthController?.abort();
      deliveryMonthController = controller;
    } else {
      deliveryController?.abort();
      deliveryController = controller;
    }

    try {
      const startDate = String(rawDate || "").trim();

      const datePattern = isMonthly ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(startDate)) {
        throw new Error(isMonthly
          ? "Tháng export không hợp lệ. Định dạng yêu cầu: YYYY-MM."
          : "Ngày export không hợp lệ. Định dạng yêu cầu: YYYY-MM-DD.");
      }

      post("SPX_DELIVERY_EXPORT_PROGRESS", {
        requestId,
        reportType,
        stage: "create",
        startDate
      });

      const createUrl =
        "/api/driverservice/admin/performance/delivery/export/list" +
        `?function_type=0&frequency=${frequency}&start_date=${encodeURIComponent(startDate)}`;

      const created = await fetchDeliveryJson(createUrl, { method: "GET", signal:controller.signal });
      const taskId = Number(created?.data?.task_id || created?.data?.fms_task_id || 0);

      if (!taskId) {
        throw new Error("SPX không trả về task_id cho Delivery Performance.");
      }

      post("SPX_DELIVERY_EXPORT_PROGRESS", {
        requestId,
        reportType,
        stage: "task-created",
        taskId,
        startDate
      });

      const task = await findDeliveryExportTask(taskId, requestId, reportType, controller);
      const csvText = await downloadDeliveryCsv(task, requestId, reportType, controller);

      post("SPX_DELIVERY_EXPORT_RESULT", {
        requestId,
        reportType,
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
        post("SPX_DELIVERY_EXPORT_CANCELLED", { requestId, reportType });
      } else {
        post("SPX_DELIVERY_EXPORT_ERROR", {
          requestId,
          reportType,
          message: String(error?.message || error || "Không thể export Delivery Performance.")
        });
      }
    } finally {
      if (isMonthly) {
        if (deliveryMonthController === controller) deliveryMonthController = null;
      } else if (deliveryController === controller) {
        deliveryController = null;
      }
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
      runPickupAssignment(data.requestId, data.range || {}, data.addressCache || {});
      return;
    }

    if (data.type === "SPX_PICKUP_ASSIGNMENT_CANCEL") {
      pickupController?.abort();
      return;
    }

    if (data.type === "SPX_DELIVERY_EXPORT_RUN") {
      runDeliveryExport(data.requestId, data.startDate, 1, "day");
      return;
    }

    if (data.type === "SPX_DELIVERY_MONTH_EXPORT_RUN") {
      runDeliveryExport(data.requestId, data.startDate, 4, "month");
      return;
    }

    if (data.type === "SPX_DELIVERY_EXPORT_CANCEL") {
      deliveryController?.abort();
      return;
    }

    if (data.type === "SPX_DELIVERY_MONTH_EXPORT_CANCEL") {
      deliveryMonthController?.abort();
    }
  });

  post("SPX_FMS_BRIDGE_READY");
})();

// ---- SPX status data ----

"use strict";

globalThis.SPX_FMS_STATUS_OPTIONS = [{"code":"0","name":"Created"},{"code":"1","name":"LMHub_Received"},{"code":"2","name":"Delivering"},{"code":"3","name":"Cancelled"},{"code":"4","name":"Delivered"},{"code":"5","name":"OnHold"},{"code":"6","name":"Return_SOC_Returned"},{"code":"7","name":"SOC_PendingReceive"},{"code":"8","name":"SOC_Received"},{"code":"9","name":"SOC_Packing"},{"code":"10","name":"Return_LMHub_Received"},{"code":"11","name":"Lost"},{"code":"12","name":"Damaged"},{"code":"13","name":"SOC_Pickup_Done"},{"code":"14","name":"Return_Failed"},{"code":"15","name":"SOC_LHTransporting"},{"code":"18","name":"SOC_Handover"},{"code":"26","name":"Disposed"},{"code":"30","name":"SOC_Pickup_Onhold"},{"code":"31","name":"SOC_Pickup_Failed"},{"code":"32","name":"SOC_Pickup_Handedover"},{"code":"33","name":"SOC_Packed"},{"code":"34","name":"SOC_LHPacking"},{"code":"35","name":"SOC_LHPacked"},{"code":"36","name":"SOC_LHTransported"},{"code":"37","name":"FMHub_Pickup_Onhold"},{"code":"38","name":"FMHub_Pickup_Failed"},{"code":"39","name":"FMHub_Pickup_Done"},{"code":"40","name":"FMHub_Pickup_Handedover"},{"code":"41","name":"FMHub_PendingReceive"},{"code":"42","name":"FMHub_Received"},{"code":"43","name":"FMHub_Packing"},{"code":"44","name":"FMHub_Packed"},{"code":"45","name":"FMHub_LHPacking"},{"code":"46","name":"FMHub_LHPacked"},{"code":"47","name":"FMHub_LHTransporting"},{"code":"48","name":"FMHub_LHTransported"},{"code":"49","name":"LMHub_Assigning"},{"code":"50","name":"LMHub_Assigned"},{"code":"51","name":"Collected"},{"code":"52","name":"Return_LMHub_Packing"},{"code":"53","name":"Return_LMHub_Packed"},{"code":"54","name":"Return_LMHub_LHPacking"},{"code":"55","name":"Return_LMHub_LHPacked"},{"code":"56","name":"Return_LMHub_LHTransporting"},{"code":"57","name":"Return_LMHub_LHTransported"},{"code":"58","name":"Return_SOC_Received"},{"code":"59","name":"Return_SOC_Packing"},{"code":"60","name":"Return_SOC_Packed"},{"code":"61","name":"Return_SOC_LHPacking"},{"code":"62","name":"Return_SOC_LHPacked"},{"code":"63","name":"Return_SOC_Returning"},{"code":"64","name":"Return_SOC_LHTransporting"},{"code":"65","name":"Return_SOC_LHTransported"},{"code":"66","name":"Return_SOC_Onhold"},{"code":"67","name":"Return_FMHub_Received"},{"code":"68","name":"Return_FMHub_Packing"},{"code":"69","name":"Return_FMHub_Packed"},{"code":"70","name":"Return_FMHub_LHPacking"},{"code":"71","name":"Return_FMHub_LHPacked"},{"code":"72","name":"Return_FMHub_Returning"},{"code":"73","name":"Return_FMHub_Returned"},{"code":"74","name":"Return_FMHub_Onhold"},{"code":"75","name":"3PL_PickupDone"},{"code":"76","name":"3PL_HubReceived"},{"code":"77","name":"3PL_HubOutbound"},{"code":"78","name":"3PL_InTransit"},{"code":"79","name":"3PL_Assigned"},{"code":"80","name":"3PL_Onhold"},{"code":"81","name":"3PL_Delivered"},{"code":"82","name":"Exception_Packing"},{"code":"83","name":"Exception_Packed"},{"code":"84","name":"Exception_LHPacking"},{"code":"85","name":"Exception_LHPacked"},{"code":"86","name":"Exception_LHTransporting"},{"code":"87","name":"Exception_LHTransported"},{"code":"89","name":"3PL_Received"},{"code":"90","name":"3PL_Transporting"},{"code":"91","name":"3PL_Delivering"},{"code":"92","name":"3PL_Ready_For_Collection"},{"code":"93","name":"3PL_Return_Started"},{"code":"94","name":"3PL_Returning"},{"code":"95","name":"3PL_Returned"},{"code":"96","name":"3PL_Lost"},{"code":"97","name":"3PL_SOC_Inbound"},{"code":"98","name":"3PL_SOC_Outbound"},{"code":"99","name":"3PL_LMHub_Inbound"},{"code":"100","name":"3PL_Others"},{"code":"101","name":"SOC_FLTransporting1"},{"code":"102","name":"SOC_FLTransporting2"},{"code":"103","name":"SOC_FLOnhold"},{"code":"104","name":"SOC_FLTransporting3"},{"code":"106","name":"Return_LMHub_FLTransporting1"},{"code":"107","name":"Return_LMHub_FLTransporting2"},{"code":"108","name":"Return_LMHub_FLOnhold"},{"code":"109","name":"Return_LMHub_FLTransporting3"},{"code":"111","name":"DOP_Created"},{"code":"112","name":"DOP_Received"},{"code":"113","name":"DOP_InProgress"},{"code":"114","name":"Reallocate"},{"code":"115","name":"Return_FMHub_Assigning"},{"code":"116","name":"Return_FMHub_Assigned"},{"code":"117","name":"Return_SOC_Assigning"},{"code":"118","name":"Return_SOC_Assigned"},{"code":"119","name":"Return_LMHub_Assigning"},{"code":"120","name":"Return_LMHub_Assigned"},{"code":"121","name":"Return_FMHub_Processed"},{"code":"122","name":"Return_SOC_Processed"},{"code":"123","name":"Return_LMHub_Processed"},{"code":"124","name":"Return_LMHub_Returning"},{"code":"125","name":"Return_LMHub_Returned"},{"code":"126","name":"Return_LMHub_Onhold"},{"code":"127","name":"SOC_OrderLevelHandover"},{"code":"128","name":"SOC_pickup_retry"},{"code":"129","name":"FMHub_pickup_retry"},{"code":"130","name":"SOC_pickup_pending_failed"},{"code":"131","name":"FMHub_pickup_pending_failed"},{"code":"137","name":"LMHub_Delivery_transfer"},{"code":"138","name":"LMHub_BAT_Assigned"},{"code":"140","name":"SP_Ready_Collection"},{"code":"141","name":"SP_Collection_Reminder1"},{"code":"142","name":"SP_Collection_Reminder2"},{"code":"143","name":"SP_Collection_Reminder3"},{"code":"144","name":"SP_Collection_Reminder4"},{"code":"145","name":"SP_Collection_Collected"},{"code":"146","name":"SP_Collection_Failed"},{"code":"147","name":"SP_Returning"},{"code":"148","name":"SP_Collection_OnHold"},{"code":"149","name":"Transporting_to_sp"},{"code":"150","name":"Transported_to_sp"},{"code":"151","name":"Return_FMHub_Pickup_Done"},{"code":"152","name":"Return_SOC_Pickup_Done"},{"code":"153","name":"Return_SOC_Handover"},{"code":"170","name":"Return_SOC_Pickup_Created"},{"code":"171","name":"Return_FMHub_Pickup_Created"},{"code":"174","name":"Return_SOC_Pickup_Onhold"},{"code":"175","name":"Return_FMHub_Pickup_Onhold"},{"code":"178","name":"Return_SOC_Pickup_Handedover"},{"code":"179","name":"Return_FMHub_Pickup_Handedover"},{"code":"182","name":"Return_LMHub_Transporting_to_sp"},{"code":"183","name":"Return_LMHub_Transported_to_sp"},{"code":"184","name":"Return_SP_Ready_Collection"},{"code":"185","name":"Return_SP_Collection_Reminder1"},{"code":"186","name":"Return_SP_Collection_Reminder2"},{"code":"187","name":"Return_SP_Collection_Reminder3"},{"code":"188","name":"Return_SP_Collection_Reminder4"},{"code":"189","name":"Return_SP_Collection_Collected"},{"code":"190","name":"Return_SP_Collection_Failed"},{"code":"191","name":"Return_SOC_Pickup_Created_To_Disposal"},{"code":"192","name":"Return_FMHub_Pickup_Created_To_Disposal"},{"code":"193","name":"Return_SOC_Pickup_Done_To_Disposal"},{"code":"194","name":"Return_FMHub_Pickup_Done_To_Disposal"},{"code":"195","name":"Return_SOC_Pickup_Onhold_To_Disposal"},{"code":"196","name":"Return_FMHub_Pickup_Onhold_To_Disposal"},{"code":"199","name":"Return_SOC_Pickup_Handedover_To_Disposal"},{"code":"200","name":"Return_FMHub_Pickup_Handedover_To_Disposal"},{"code":"201","name":"Return_SOC_To_Disposal"},{"code":"202","name":"Return_FMHub_To_Disposal"},{"code":"203","name":"Return_SP_Returning"},{"code":"204","name":"Return_FMHub_Transported_to_sp"},{"code":"205","name":"Return_FMHub_Transporting_to_sp"},{"code":"206","name":"Return_SOC_Transported_to_sp"},{"code":"207","name":"Return_SOC_Transporting_to_sp"},{"code":"208","name":"Return_SOC_Collected"},{"code":"209","name":"Return_SP_Returned"},{"code":"210","name":"LMHub_Packing"},{"code":"211","name":"LMHub_Packed"},{"code":"221","name":"SOC_Manifest_Received"},{"code":"222","name":"Fraud_Order_Intercepted"},{"code":"231","name":"LMHub_LHPacking"},{"code":"232","name":"LMHub_LHPacked"},{"code":"233","name":"LMHub_LHTransporting"},{"code":"234","name":"LMHub_LHTransported"},{"code":"235","name":"Return_FMHub_LHTransporting"},{"code":"236","name":"Return_FMHub_LHTransported"},{"code":"250","name":"RETURN_LMHUB_TO_DISPOSAL"},{"code":"251","name":"RETURN_HUB_TO_DISPOSAL"},{"code":"300","name":"SP_Packing"},{"code":"301","name":"SP_Packed"},{"code":"302","name":"Return_SP_Packing"},{"code":"303","name":"Return_SP_Packed"},{"code":"304","name":"Return_SP_Packing_To_Disposal"},{"code":"305","name":"Return_SP_Packed_To_Disposal"},{"code":"306","name":"SP_Pickup_Done"},{"code":"310","name":"SP_Outbounding"},{"code":"311","name":"Return_SP_Outbounding"},{"code":"312","name":"SP_Unpaid"},{"code":"313","name":"Station_Weighing_Done"},{"code":"314","name":"Locker_Booked_Success"},{"code":"315","name":"Locker_Booked_Failed"},{"code":"316","name":"Transported_to_Locker"},{"code":"317","name":"Locker_Ready_Collection"},{"code":"318","name":"Locker_Collection_Failed"},{"code":"319","name":"Return_Locker_Timeout"},{"code":"320","name":"Return_Driver_Retrieved"},{"code":"321","name":"Return_Locker_Retrieved"},{"code":"322","name":"Locker_Collection_Collected"},{"code":"323","name":"Locker_Ready_Collection_Reminder1"},{"code":"324","name":"Locker_Ready_Collection_Reminder2"},{"code":"325","name":"Locker_Ready_Collection_Reminder3"},{"code":"330","name":"SP_LHPacking"},{"code":"331","name":"SP_LHPacked"},{"code":"332","name":"SP_LHTransporting"},{"code":"333","name":"SP_LHTransported"},{"code":"334","name":"Return_SP_LHPacking"},{"code":"335","name":"Return_SP_LHPacked"},{"code":"336","name":"Return_SP_LHTransporting"},{"code":"337","name":"Return_SP_LHTransported"},{"code":"338","name":"Return_SP_LHPacking_To_Disposal"},{"code":"339","name":"Return_SP_LHPacked_To_Disposal"},{"code":"340","name":"Return_SP_LHTransporting_To_Disposal"},{"code":"341","name":"Return_SP_LHTransported_To_Disposal"},{"code":"342","name":"Return_SOC_Received_To_Disposal"},{"code":"343","name":"SOC_Collected"},{"code":"400","name":"Hub_Received"},{"code":"401","name":"Hub_PendingReceive"},{"code":"402","name":"Hub_Pickup_Onhold"},{"code":"403","name":"Hub_Pickup_Failed"},{"code":"404","name":"Hub_Pickup_Done"},{"code":"405","name":"Hub_Pickup_Handedover"},{"code":"406","name":"Hub_Pickup_Retry"},{"code":"407","name":"Hub_Pickup_Pending_Failed"},{"code":"408","name":"Hub_Manifest_Received"},{"code":"409","name":"Hub_Packing"},{"code":"410","name":"Hub_Packed"},{"code":"411","name":"Hub_LHPacking"},{"code":"412","name":"Hub_LHPacked"},{"code":"413","name":"Hub_Handover"},{"code":"414","name":"Hub_OrderLevelHandover"},{"code":"415","name":"Hub_LHTransporting"},{"code":"416","name":"Hub_LHTransported"},{"code":"417","name":"Hub_Assigning"},{"code":"418","name":"Hub_Assigned"},{"code":"419","name":"Hub_BAT_Assigned"},{"code":"420","name":"Hub_Delivery_transfer"},{"code":"440","name":"Return_Hub_Received"},{"code":"441","name":"Return_Hub_Pickup_Created"},{"code":"442","name":"Return_Hub_Pickup_Done"},{"code":"443","name":"Return_Hub_Pickup_Handedover"},{"code":"444","name":"Return_Hub_Pickup_Onhold"},{"code":"445","name":"Return_Hub_Pickup_Created_to_Disposal"},{"code":"446","name":"Return_Hub_Pickup_Done_to_Disposal"},{"code":"447","name":"Return_Hub_Pickup_Handedover_to_Disposal"},{"code":"448","name":"Return_Hub_Pickup_Onhold_to_Disposal"},{"code":"449","name":"Return_Hub_Packing"},{"code":"450","name":"Return_Hub_Packed"},{"code":"451","name":"Return_Hub_LHPacking"},{"code":"452","name":"Return_Hub_LHPacked"},{"code":"453","name":"Return_Hub_Handover"},{"code":"454","name":"Return_Hub_LHTransporting"},{"code":"455","name":"Return_Hub_LHTransported"},{"code":"456","name":"Return_Hub_Assigning"},{"code":"457","name":"Return_Hub_Assigned"},{"code":"458","name":"Return_Hub_Onhold"},{"code":"459","name":"Return_Hub_Returning"},{"code":"460","name":"Return_Hub_Returned"},{"code":"461","name":"Return_Hub_Transporting_to_sp"},{"code":"462","name":"Return_Hub_Transported_to_sp"},{"code":"463","name":"Return_Hub_Processed"},{"code":"464","name":"Return_Hub_Collected"},{"code":"550","name":"Liquidating"},{"code":"551","name":"Liquidated"},{"code":"552","name":"FMHub_Pickup_Handover_Onhold"},{"code":"553","name":"SOC_Pickup_Handover_Onhold"},{"code":"554","name":"Hub_Pickup_Handover_Onhold"},{"code":"555","name":"Return_FMHub_Pickup_Handover_Onhold"},{"code":"556","name":"Return_SOC_Pickup_Handover_Onhold"},{"code":"557","name":"Return_Hub_Pickup_Handover_Onhold"},{"code":"558","name":"Disposal_FMHub_Pickup_Handover_Onhold"},{"code":"559","name":"Disposal_SOC_Pickup_Handover_Onhold"},{"code":"560","name":"Disposal_Hub_Pickup_Handover_Onhold"},{"code":"561","name":"Buyer_Return_FMHub_Pickup_Handover_Onhold"},{"code":"562","name":"Buyer_Return_Disposal_SOC_Pickup_Handover_Onhold"},{"code":"563","name":"Buyer_Return_Disposal_hub_Pickup_Handover_Onhold"},{"code":"570","name":"Pending Intercept"},{"code":"571","name":"Intercepting"},{"code":"572","name":"Cancel Intercept"},{"code":"573","name":"Intercepted"},{"code":"574","name":"EHA Inbound"},{"code":"575","name":"EHA Resolved"},{"code":"580","name":"Parcel_Sweeper_Scan"},{"code":"581","name":"Missing"},{"code":"582","name":"FMhub_Pickup_Transfer_to_Driver"},{"code":"583","name":"SOC_Pickup_Transfer_to_Driver"},{"code":"584","name":"Hub_Pickup_Transfer_to_Driver"},{"code":"585","name":"Return_FMhub_Pickup_Transfer_to_Driver"},{"code":"586","name":"Return_Hub_Pickup_Transfer_to_Driver"},{"code":"587","name":"Return_SOC_Pickup_Transfer_to_Driver"},{"code":"588","name":"Disposal_FMhub_Pickup_Transfer_to_Driver"},{"code":"589","name":"Disposal_Hub_Pickup_Transfer_to_Driver"},{"code":"590","name":"Disposal_SOC_Pickup_Transfer_to_Driver"},{"code":"591","name":"FMhub_Pickup_Handedover_to_Station"},{"code":"592","name":"SOC_Pickup_Handedover_to_Station"},{"code":"593","name":"Hub_Pickup_Handedover_to_Station"},{"code":"594","name":"Return_FMhub_Pickup_Handedover_to_Station"},{"code":"595","name":"Return_SOC_Pickup_Handedover_to_Station"},{"code":"596","name":"Return_Hub_Pickup_Handedover_to_Station"},{"code":"597","name":"Disposal_FMhub_Pickup_Handedover_to_Station"},{"code":"598","name":"Disposal_SOC_Pickup_Handedover_to_Station"},{"code":"599","name":"Disposal_Hub_Pickup_Handedover_to_Station"},{"code":"600","name":"FMhub_Pickup_Transfer_Driver_Onhold"},{"code":"601","name":"SOC_Pickup_Transfer_Driver_Onhold"},{"code":"602","name":"Hub_Pickup_Transfer_Driver_Onhold"},{"code":"603","name":"Return_FMhub_Pickup_Transfer_Driver_Onhold"},{"code":"604","name":"Return_SOC_Pickup_Transfer_Driver_Onhold"},{"code":"605","name":"Return_Hub_Pickup_Transfer_Driver_Onhold"},{"code":"606","name":"Disposal_FMhub_Pickup_Transfer_Driver_Onhold"},{"code":"607","name":"Disposal_SOC_Pickup_Transfer_Driver_Onhold"},{"code":"608","name":"Disposal_Hub_Pickup_Transfer_Driver_Onhold"},{"code":"609","name":"Abandoned_track_code_1"},{"code":"610","name":"Liquidate_Packing"},{"code":"611","name":"Liquidate_Packed"},{"code":"612","name":"Liquidate_LHPacking"},{"code":"613","name":"Liquidate_LHPacked"},{"code":"614","name":"Liquidate_LHTransporting"},{"code":"615","name":"Liquidate_LHTransported"},{"code":"616","name":"Liquidate_Received"},{"code":"617","name":"LiquidatePallet_Packing"},{"code":"618","name":"LiquidatePallet_Packed"},{"code":"619","name":"Return_LMHub_Delivery_Transfer"},{"code":"620","name":"Return_Hub_Delivery_Transfer"},{"code":"621","name":"SOC_Intra_Handover_Packing"},{"code":"622","name":"SOC_Intra_Handover_Packed"},{"code":"623","name":"SOC_Intra_Handover_Received"},{"code":"624","name":"SOC_Pending_Processing"},{"code":"625","name":"Return_SOC_Intra_Handover_Packing"},{"code":"626","name":"Return_SOC_Intra_Handover_Packed"},{"code":"627","name":"Return_SOC_Intra_Handover_Received"},{"code":"628","name":"Return_SOC_Pending_Processing"},{"code":"629","name":"ASM_Rejected"},{"code":"630","name":"SOC_Staging"},{"code":"631","name":"Return_SOC_Staging"},{"code":"632","name":"FMHub_Staging"},{"code":"633","name":"Return_FMHub_Staging"},{"code":"634","name":"LMHub_Staging"},{"code":"635","name":"Return_LMHub_Staging"},{"code":"636","name":"Hub_Staging"},{"code":"637","name":"Return_Hub_Staging"},{"code":"638","name":"FMHub_Pending_Processing"},{"code":"639","name":"LMHub_Pending_Processing"},{"code":"640","name":"Hub_Pending_Processing"},{"code":"641","name":"Return_FMHub_Pending_Processing"},{"code":"642","name":"Return_LMHub_Pending_Processing"},{"code":"643","name":"Return_Hub_Pending_Processing"},{"code":"644","name":"MAWB_Grouped"},{"code":"645","name":"Return_MAWB_Grouped"},{"code":"646","name":"Exception_Reason_Resolved"},{"code":"647","name":"Exception_Reason_Expired"},{"code":"648","name":"Exception_Reason_Cancelled"},{"code":"649","name":"Pending_Delivery_Address_Update"},{"code":"650","name":"Exception_Reason_Added"},{"code":"651","name":"Send_PN_To_Recipient"},{"code":"652","name":"Send_PN_To_Sender"},{"code":"653","name":"Return_Hub_BAT_Assigned"},{"code":"654","name":"VIPSeller_Pickup_Packing"},{"code":"655","name":"VIPSeller_Pickup_Packed"},{"code":"656","name":"Return_SOC_Stage_Out"},{"code":"657","name":"SOC_Stage_Out"},{"code":"658","name":"FMHub_Pickup_Assigned"},{"code":"659","name":"SOC_Pickup_Assigned"},{"code":"660","name":"Hub_Pickup_Assigned"},{"code":"661","name":"3PL_Reverse_Transporting"},{"code":"662","name":"3PL_Reverse_Handover"},{"code":"663","name":"3PL_Reverse_Returning"},{"code":"664","name":"3PL_Reverse_Returned"},{"code":"665","name":"3PL_Reverse_Onhold"},{"code":"666","name":"Return_SOC_Cache_Packing"},{"code":"667","name":"Return_FMHub_Cache_Packing"},{"code":"668","name":"Return_LMHub_Cache_Packing"},{"code":"669","name":"Return_Hub_Cache_Packing"},{"code":"670","name":"Return_SOC_Cache_Packed"},{"code":"671","name":"Return_FMHub_Cache_Packed"},{"code":"672","name":"Return_LMHub_Cache_Packed"},{"code":"673","name":"Return_Hub_Cache_Packed"},{"code":"679","name":"SOC_Cache_Packing"},{"code":"680","name":"FMHub_Cache_Packing"},{"code":"681","name":"LMHub_Cache_Packing"},{"code":"682","name":"Hub_Cache_Packing"},{"code":"683","name":"SOC_Cache_Packed"},{"code":"684","name":"FMHub_Cache_Packed"},{"code":"685","name":"LMHub_Cache_Packed"},{"code":"686","name":"Hub_Cache_Packed"},{"code":"715","name":"LMHub_Feeder_Transferring"},{"code":"716","name":"LMHub_Feeder_Transferred"},{"code":"718","name":"LMHub_Feeder_Onhold_Transferring"},{"code":"719","name":"LMHub_Feeder_Onhold_Transferred"},{"code":"720","name":"Return_LMHub_Feeder_Transferring"},{"code":"721","name":"Return_Hub_Feeder_Transferring"},{"code":"722","name":"Return_LMHub_Feeder_Transferred"},{"code":"723","name":"Return_Hub_Feeder_Transferred"},{"code":"726","name":"Return_LMHub_Feeder_Onhold_Transferring"},{"code":"727","name":"Return_Hub_Feeder_Onhold_Transferring"},{"code":"728","name":"Return_LMHub_Feeder_Onhold_Transferred"},{"code":"729","name":"Return_Hub_Feeder_Onhold_Transferred"},{"code":"730","name":"Disposing"},{"code":"731","name":"Disposal_Received"},{"code":"732","name":"Disposal_Packing"},{"code":"733","name":"Disposal_Packed"},{"code":"734","name":"Disposal_LHPacking"},{"code":"735","name":"Disposal_LHPacked"},{"code":"736","name":"Disposal_LHTransporting"},{"code":"737","name":"Disposal_LHTransported"},{"code":"738","name":"Return_FMHub_Pickup_Assigned"},{"code":"739","name":"Return_SOC_Pickup_Assigned"},{"code":"740","name":"Return_Hub_Pickup_Assigned"},{"code":"745","name":"Locker_DOP_Received"},{"code":"746","name":"Locker_Retrieved"},{"code":"747","name":"Locker_Retrieval_Timeout"},{"code":"749","name":"LMHub_MH_Handedover"},{"code":"750","name":"Intercepted_at_SP"},{"code":"751","name":"Exception_Reason_Rejected"},{"code":"782","name":"SP_HD_Received"},{"code":"783","name":"SP_Ready_for_Delivering"},{"code":"784","name":"Return_SP_HD_Received"},{"code":"785","name":"Station_Container_Packing"},{"code":"786","name":"Return_Station_Container_Packing"},{"code":"787","name":"Station_Container_Packed"},{"code":"788","name":"Return_Station_Container_Packed"},{"code":"789","name":"SP_HD_Assigning"},{"code":"790","name":"SP_HD_Assigned"},{"code":"791","name":"Interception_Pickup_Done"},{"code":"792","name":"Interception_Pickup_Onhold"},{"code":"793","name":"Interception_Pickup_Transfer_to_Driver"},{"code":"794","name":"Interception_Pickup_Handedover_to_Station"},{"code":"795","name":"Interception_Pickup_Assigned"},{"code":"796","name":"Interception_Pickup_Handover_Onhold"},{"code":"797","name":"Interception_Pickup_Retry"},{"code":"798","name":"Interception_Pickup_Failed"},{"code":"799","name":"Interception_Pickup_Pending_Failed"},{"code":"800","name":"Interception_Transfer_Driver_Onhold"},{"code":"801","name":"SP_HD_Delivery_transfer"},{"code":"802","name":"WHS_Received"},{"code":"803","name":"WHS_Packing"},{"code":"804","name":"WHS_Packed"},{"code":"805","name":"WHS_Handover"},{"code":"806","name":"WHS_LHPacking"},{"code":"807","name":"WHS_LHPacked"},{"code":"808","name":"WHS_LHTransporting"},{"code":"809","name":"WHS_LHTransported"},{"code":"810","name":"Return_WHS_Received"},{"code":"811","name":"Return_WHS_Packing"},{"code":"812","name":"Return_WHS_Packed"},{"code":"813","name":"Return_WHS_LHPacking"},{"code":"814","name":"Return_WHS_LHPacked"},{"code":"815","name":"Return_WHS_LHTransporting"},{"code":"816","name":"Return_WHS_LHTransported"},{"code":"817","name":"WHS_Staging"},{"code":"818","name":"Return_WHS_Staging"},{"code":"819","name":"WHS_Pending_Process"},{"code":"820","name":"Return_WHS_Pending_Process"},{"code":"821","name":"WHS_Stage_Out"},{"code":"822","name":"Return_WHS_Stage_Out"},{"code":"823","name":"Return_WHS_Handover"},{"code":"824","name":"WHS_Intra_Handover_Packed"},{"code":"825","name":"Return_WHS_Intra_Handover_Packed"},{"code":"826","name":"WHS_Intra_Handover_Packing"},{"code":"827","name":"Return_WHS_Intra_Handover_Packing"},{"code":"828","name":"WHS_Intra_Handover_Received"},{"code":"829","name":"Return_WHS_Intra_Handover_Received"},{"code":"830","name":"WHS_Manifest_Received"},{"code":"831","name":"Return_WHS_Returned"},{"code":"832","name":"Exception_SP_Packing"},{"code":"833","name":"Exception_SP_Packed"},{"code":"835","name":"Send_PN_to_Recipient_Reroute"},{"code":"836","name":"3PL_Reverse_Pickup_Failed"},{"code":"837","name":"Hub_Feeder_Transferred"},{"code":"838","name":"Hub_Feeder_Transferring"},{"code":"839","name":"Hub_Feeder_Onhold_Transferring"},{"code":"840","name":"Hub_Feeder_Onhold_Transferred"},{"code":"841","name":"Return_Holding"},{"code":"842","name":"Delivery_Holding"},{"code":"843","name":"SP_Pitstop_Received"},{"code":"844","name":"Return_SP_Pitstop_Received"},{"code":"845","name":"SP_Pitstop_Outbound"},{"code":"846","name":"Return_SP_Pitstop_Outbound"},{"code":"847","name":"Escalation_Ticket_Send_PN"},{"code":"848","name":"SOC_Sorting"},{"code":"849","name":"Return_SOC_Sorting"},{"code":"867","name":"Parcel_Confiscated"},{"code":"870","name":"Locker_Booked_Expired"},{"code":"872","name":"Transporting_to_Locker"},{"code":"873","name":"Hub_Intra_Handover_Packed"},{"code":"874","name":"Hub_Intra_Handover_Received"},{"code":"875","name":"Return_Hub_Intra_Handover_Packing"},{"code":"876","name":"Return_Hub_Intra_Handover_Packed"},{"code":"877","name":"Return_Hub_Intra_Handover_Received"},{"code":"878","name":"Hub_Intra_Handover_Packing"},{"code":"879","name":"FMHub_LHArrived"},{"code":"880","name":"LMHub_LHArrived"},{"code":"881","name":"Hub_LHArrived"},{"code":"882","name":"SOC_LHArrived"},{"code":"883","name":"WHS_LHArrived"},{"code":"884","name":"Return_FMHub_LHArrived"},{"code":"885","name":"Return_LMHub_LHArrived"},{"code":"886","name":"Return_Hub_LHArrived"},{"code":"887","name":"Return_SOC_LHArrived"},{"code":"888","name":"Return_WHS_LHArrived"},{"code":"889","name":"Airhub_LHTransported"},{"code":"890","name":"Airhub_AHPacked"},{"code":"891","name":"Airhub_AHTransporting"},{"code":"892","name":"Airhub_AHTransported"},{"code":"893","name":"Airhub_retained"},{"code":"894","name":"Airhub_Released"},{"code":"895","name":"Airhub_LHPacked"},{"code":"897","name":"Task_Completed"},{"code":"904","name":"SP_Collection_Extended"},{"code":"905","name":"SP_Collection_Extended_Reminder1"},{"code":"906","name":"SP_Collection_Extended_Reminder2"},{"code":"907","name":"SP_Collection_Extended_Reminder3"},{"code":"908","name":"3PL_Delivery_Cancelled"},{"code":"909","name":"Locker_Deposit_Confirmed"},{"code":"913","name":"SP_Returned_On_the_Spot"},{"code":"914","name":"Hub_LHUnloading"},{"code":"915","name":"Return_Hub_LHUnloading"},{"code":"916","name":"FMHub_LHUnloading"},{"code":"917","name":"Return_FMHub_LHUnloading"},{"code":"918","name":"SOC_LHUnloading"},{"code":"919","name":"Return_SOC_LHUnloading"},{"code":"920","name":"LMHub_LHUnloading"},{"code":"921","name":"Return_LMHub_LHUnloading"},{"code":"922","name":"WHS_LHUnloading"},{"code":"923","name":"Return_WHS_LHUnloading"},{"code":"924","name":"HUB_LHUnloaded"},{"code":"925","name":"Return_HUB_LHUnloaded"},{"code":"926","name":"FMHub_LHUnloaded"},{"code":"927","name":"Return_FMHub_LHUnloaded"},{"code":"928","name":"SOC_LHUnloaded"},{"code":"929","name":"Return_SOC_LHUnloaded"},{"code":"930","name":"LMHub_LHUnloaded"},{"code":"931","name":"Return_LMHub_LHUnloaded"},{"code":"932","name":"WHS_LHUnloaded"},{"code":"933","name":"Return_WHS_LHUnloaded"},{"code":"934","name":"LMHub_Sorted"},{"code":"935","name":"Hub_Sorted"},{"code":"937","name":"SP_LHUnloading"},{"code":"938","name":"Return_SP_LHUnloading"},{"code":"939","name":"SP_LHUnloaded"},{"code":"940","name":"Return_SP_LHUnloaded"},{"code":"945","name":"SP_LHArrived"},{"code":"946","name":"Return_SP_LHArrived"},{"code":"947","name":"MAWB_Removed"},{"code":"948","name":"Return_MAWB_Removed"},{"code":"949","name":"MAWB_Added"},{"code":"950","name":"Return_MAWB_Added"},{"code":"951","name":"SP_DOP_OUTBOUND"},{"code":"953","name":"LMHub_Sorting"},{"code":"954","name":"Hub_Sorting"},{"code":"970","name":"Intercepted_at_Locker"},{"code":"989","name":"FMHub_Pickup_Sorted"},{"code":"990","name":"SOC_Pickup_Sorted"},{"code":"991","name":"Hub_Pickup_Sorted"},{"code":"992","name":"SP_Pickup_Sorted"},{"code":"993","name":"Return_SOC_Pickup_Sorted"},{"code":"994","name":"Return_Hub_Pickup_Sorted"},{"code":"995","name":"Return_FMHub_Pickup_Sorted"},{"code":"996","name":"Return_SP_Pickup_Sorted"},{"code":"5001","name":"TO_Created"},{"code":"5002","name":"TO_CTPacking"},{"code":"5003","name":"TO_CTUnpacking  "},{"code":"5004","name":"TO_CTPacked"},{"code":"5005","name":"TO_LHTransporting"},{"code":"5006","name":"TO_LHTransported"},{"code":"5007","name":"TO_Received"},{"code":"5008","name":"TO_DOP_Received"},{"code":"5009","name":"TO_LHPacking"},{"code":"5010","name":"TO_LHPacked"},{"code":"6001","name":"Installation_Created"},{"code":"6002","name":"Assigning"},{"code":"6003","name":"Assigned_Done"},{"code":"6004","name":"Installation_Cancelled"},{"code":"6005","name":"In_Transit"},{"code":"6006","name":"Installed"},{"code":"6007","name":"On_Hold"},{"code":"6008","name":"Installation_Failed"},{"code":"6009","name":"Closed"},{"code":"16211","name":"FMHub_Handover"}];

// ---- SPX responsive UI ----

(() => {
  "use strict";

  if (window.__SPX_FMS_AUDIT_UI__) return;
  window.__SPX_FMS_AUDIT_UI__ = true;

  const STATUSES = Array.isArray(globalThis.SPX_FMS_STATUS_OPTIONS)
    ? globalThis.SPX_FMS_STATUS_OPTIONS
    : [];
  const STATUS_MAP = new Map(STATUSES.map(x => [String(x.code), x.name]));
  const DEFAULT_STATUSES = ["880", "36", "15"];
  const PAGE_SIZE = 25;
  const PICKUP_ADDRESS_CACHE_KEY = "spxPickupAddressCacheV1";
  const PICKUP_ADDRESS_CACHE_TTL = 3 * 24 * 60 * 60 * 1000;
  const APP_ICON_URL = globalThis.chrome?.runtime?.getURL
    ? chrome.runtime.getURL("icons/icon-48.png")
    : "";

  function localDateInputValue(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  const state = {
    open:false, activeTab:"fms", drawerOpen:false, statusSearch:"",
    loading:false, bridgeReady:false, requestId:"",
    currentStation:"1030", nextStation:"1812",
    selectedStatuses:DEFAULT_STATUSES.slice(),
    rows:[], total:0, applied:null,
    search:"", aging:"ALL", orderStatus:"ALL", page:1,
    picker:false, error:"", progress:"",
    pickup:{
      startDate:localDateInputValue(new Date(Date.now() - 92 * 86400000)),
      endDate:localDateInputValue(new Date()),
      loading:false,
      requestId:"",
      progress:"",
      error:"",
      rows:[],
      total:0,
      page:1,
       driverFilter:"ALL",
       addressCache:{}
     },
    delivery:{
      startDate:localDateInputValue(new Date()),
      loading:false,
      requestId:"",
      progress:"",
      error:"",
      taskId:0,
      stationName:"",
      fileName:"",
      csvText:"",
      rows:[],
      totals:null,
      previewDataUrl:"",
      previewOpen:false
    },
    deliveryMonth:{
      startMonth:localDateInputValue(new Date()).slice(0,7),
      loading:false,
      requestId:"",
      progress:"",
      error:"",
      taskId:0,
      fileName:"",
      rows:[],
      totals:null
    }
  };

  const esc = v => String(v ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function icon(name, size=18) {
    const icons = {
      app:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
      close:'<path d="M6 6l12 12M18 6L6 18"/>',
      fms:'<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="9"/>',
      delivery:'<path d="M4 20V11M10 20V5M16 20v-8M22 20H2"/>',
      pickup:'<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 10h5"/>',
      image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 15l-5-5L5 20"/>',
      download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
      send:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
      refresh:'<path d="M20 11a8 8 0 10-2.34 5.66"/><path d="M20 4v7h-7"/>',
      chevronDown:'<path d="M6 9l6 6 6-6"/>',
      chevronLeft:'<path d="M15 18l-6-6 6-6"/>',
      chevronRight:'<path d="M9 18l6-6-6-6"/>',
      arrowRight:'<path d="M5 12h14M14 7l5 5-5 5"/>',
      save:'<path d="M5 3h12l2 2v16H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
      trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6"/>',
      link:'<path d="M10 13a5 5 0 007.07 0l2.12-2.12a5 5 0 00-7.07-7.07L11 4.93"/><path d="M14 11a5 5 0 00-7.07 0L4.8 13.12a5 5 0 007.07 7.07L13 19.07"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
      check:'<path d="M20 6L9 17l-5-5"/>'
    };

    const body = icons[name] || icons.app;

    return '<svg class="ui-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  const stationName = id =>
    id === "1030" ? "1030 - Pleiku SOC" : "1812 - Pleiku 03 Hub";

  const statusName = code =>
    STATUS_MAP.get(String(code)) || (String(code || "").trim() ? "Trạng thái khác" : "—");

  const hours = ts =>
    Number(ts) > 0 ? Math.max(0, Date.now() - Number(ts) * 1000) / 3600000 : null;

  function aging(ts) {
    const h = hours(ts);
    if (h === null) return "—";
    if (h < 24) return "< 24H";
    if (h <= 36) return "24H → 36H";
    return "> 36H";
  }

  function elapsed(ts) {
    const h = hours(ts);
    return h === null ? "—" : (h < .1 ? "< 0.1 giờ" : h.toFixed(1) + " giờ");
  }

  function dateTime(ts) {
    if (!Number(ts)) return "—";
    return new Intl.DateTimeFormat("vi-VN",{
      day:"2-digit",month:"2-digit",year:"numeric",
      hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false
    }).format(new Date(Number(ts) * 1000));
  }

  function normalizeRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(row => ({
      shipmentId:String(row?.shipment_id || ""),
      to:String(row?.current_to_number || ""),
      orderStatus:String(row?.order_status || ""),
      current:String(row?.current_station_name || ""),
      next:String(row?.next_station_name || ""),
      latest:row?.latest_tracking_event || null,
      error:String(row?.tracking_error || "")
    })).filter(x => x.shipmentId);
  }

  function post(type, payload={}) {
    window.postMessage({source:"SPX_FMS_AUDIT_UI",type,...payload},window.location.origin);
  }

  function load() {
    if (state.loading) return;
    state.loading = true;
    state.error = "";
    state.progress = "Đang tải danh sách FMS...";
    state.requestId = Date.now() + "_" + Math.random().toString(36).slice(2);
    state.search = "";
    state.aging = "ALL";
    state.orderStatus = "ALL";
    state.page = 1;
    render();

    post("SPX_FMS_FETCH",{
      requestId:state.requestId,
      filters:{
        current_station_id:state.currentStation,
        next_station_id:state.nextStation,
        order_status:state.selectedStatuses.slice()
      }
    });
  }

  function filteredRows() {
    const q = state.search.trim().toLowerCase();
    const allowed = state.applied?.statuses?.length
      ? new Set(state.applied.statuses.map(String))
      : null;

    return state.rows.filter(row => {
      if (allowed && !allowed.has(row.orderStatus)) return false;
      if (state.orderStatus !== "ALL" && row.orderStatus !== state.orderStatus) return false;
      if (state.aging !== "ALL" && aging(row.latest?.timestamp) !== state.aging) return false;
      if (!q) return true;
      return [
        row.shipmentId,row.to,row.orderStatus,statusName(row.orderStatus),
        row.current,row.next
      ].some(v => String(v || "").toLowerCase().includes(q));
    }).sort((a,b) => Number(a.latest?.timestamp || 0) - Number(b.latest?.timestamp || 0));
  }

  function resultStatuses() {
    const source = state.applied?.statuses?.length
      ? state.applied.statuses
      : [...new Set(state.rows.map(x => x.orderStatus).filter(Boolean))];
    return source.slice().sort((a,b) => Number(a)-Number(b));
  }

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));z-index:2147483646";
  const shadow = host.attachShadow({mode:"open"});
  document.documentElement.appendChild(host);

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
  shadow.appendChild(fontLink);

  const style = document.createElement("style");
  style.textContent = `
    :host{all:initial;font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif;color:#26292e}
    *{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}
    .launch{width:42px;height:42px;padding:0;border:0;border-radius:12px;background:transparent;color:#fff;box-shadow:0 8px 22px #0002;display:grid;place-items:center}
    .launch-icon{width:42px;height:42px;border-radius:12px;display:block;object-fit:cover}
    .app{position:fixed;inset:0;width:100vw;height:100vh;background:#f5f6f8;display:flex;flex-direction:column;z-index:2147483647}
    .header{height:68px;flex:0 0 68px;padding:0 22px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between}
    .brand{display:flex;align-items:center;gap:12px}.logo{width:40px;height:40px;border-radius:12px;background:#ee4d2d;color:#fff;display:grid;place-items:center;font-weight:950}
    .title{font-size:17px;font-weight:950}.sub{font-size:10px;color:#7b8490;margin-top:2px}.close{width:38px;height:38px;border:1px solid #e2e5e9;border-radius:10px;background:#fff;font-size:20px}
    .main{flex:1;min-height:0;overflow:auto;padding:14px 18px 18px;display:grid;gap:12px}
    .card{background:#fff;border:1px solid #e2e5e9;border-radius:15px;overflow:visible}
    .cardhead{padding:11px 14px;border-bottom:1px solid #e7e9ed;background:#fafbfc;border-radius:15px 15px 0 0;display:flex;justify-content:space-between;align-items:center}
    .cardtitle{font-size:12px;font-weight:900}.hint{font-size:9.5px;color:#7c8590}
    .query{padding:12px 14px;display:grid;grid-template-columns:240px 28px 240px minmax(360px,1fr) 150px;gap:10px;align-items:end}
    .field{display:grid;gap:5px;position:relative}.label{font-size:9px;font-weight:900;text-transform:uppercase;color:#68717c}
    .input,.select,.pick{height:42px;width:100%;border:1px solid #d9dde3;border-radius:10px;background:#fff;padding:0 11px;outline:none;color:#30343a}
    .input:focus,.select:focus,.pick:focus{border-color:#f09b87;box-shadow:0 0 0 3px #ee4d2d12}
    .arrow{height:42px;display:grid;place-items:center;color:#929aa5;font-weight:900}.pick{text-align:left;font-size:11px;font-weight:800}
    .pop{position:absolute;z-index:50;top:66px;left:0;right:0;background:#fff;border:1px solid #dfe2e7;border-radius:12px;box-shadow:0 16px 40px #0002;max-height:360px;overflow:auto;padding:6px}
    .opt{display:flex;gap:8px;align-items:center;padding:7px;border-radius:7px;font-size:10px}.opt:hover{background:#f6f7f9}.opt span:first-of-type{flex:1}
    .primary{height:42px;border:0;border-radius:10px;background:#ee4d2d;color:#fff;font-size:11px;font-weight:900}.primary:disabled{opacity:.5}
    .progress,.error{padding:10px 13px;border-radius:11px;font-size:10px;font-weight:800}.progress{background:#fff8e8;border:1px solid #f1d7a5;color:#805812}.error{background:#fff1f4;border:1px solid #ffd1db;color:#a52b49}
    .tools{padding:10px 12px;display:grid;grid-template-columns:minmax(380px,1fr) 180px 300px;gap:9px;border-bottom:1px solid #e7e9ed}
    .meta{padding:8px 12px;background:#fbfcfd;border-bottom:1px solid #e7e9ed;font-size:9.5px;color:#727b86;display:flex;justify-content:space-between;gap:10px}
    .tablewrap{overflow:auto;max-height:calc(100vh - 305px);min-height:300px}table{width:100%;border-collapse:separate;border-spacing:0;min-width:1450px}
    th,td{padding:10px 11px;border-bottom:1px solid #edf0f2;text-align:left;vertical-align:top}th{position:sticky;top:0;z-index:2;background:#f8f9fa;font-size:9px;text-transform:uppercase;color:#646d78}td{font-size:10.5px;color:#505861}
    tbody tr:hover td{background:#fffaf8}.mono{font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif;font-weight:800;color:#30363d}.badge{display:inline-block;padding:3px 6px;border-radius:7px;background:#fff0ec;color:#c54429;font-size:9px;font-weight:900}.small{font-size:9px;color:#7b8490;margin-top:3px}
    .age{font-size:9px;font-weight:900;padding:4px 7px;border-radius:8px;background:#f5f6f8}.pager{height:46px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#727b86}.pager button{height:30px;border:1px solid #e0e3e7;border-radius:8px;background:#fff}
    .empty{padding:60px;text-align:center;color:#818a95;font-size:11px}

    .tabs{display:flex;gap:6px;padding:6px;background:#eceff3;border-radius:11px;width:max-content}
    .tab{height:34px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:#66707c;font-size:10.5px;font-weight:900}
    .tab.active{background:#fff;color:#ee4d2d;box-shadow:0 1px 5px #0001}
    .delivery-layout{display:grid;gap:12px}
    .delivery-form{padding:14px;display:grid;grid-template-columns:220px minmax(420px,1fr) auto;gap:16px;align-items:end}
    .delivery-flow{height:42px;display:flex;align-items:center;justify-content:center;gap:9px;border:1px dashed #d9dde3;border-radius:10px;background:#fafbfc;color:#66707b;font-size:10px;font-weight:800}
    .delivery-flow b{color:#a2a9b2}.delivery-form-actions{display:flex;gap:8px}
    .delivery-run{padding:0 18px}.ghostbtn{height:38px;padding:0 12px;border:1px solid #dfe3e8;border-radius:9px;background:#fff;color:#56606b;font-size:10px;font-weight:900}
    .task-chip{padding:5px 9px;border-radius:999px;background:#fff0ec;color:#c54429;font-size:9px;font-weight:900}
    .delivery-result{background:#fff;border:1px solid #e2e5e9;border-radius:15px;overflow:hidden}
    .delivery-result-head{padding:11px 14px;border-bottom:1px solid #e7e9ed;background:#fafbfc;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .delivery-actions{display:flex;gap:7px}.delivery-table-wrap{overflow:auto;max-height:calc(100vh - 300px)}
    .delivery-table{width:100%;min-width:900px;border-collapse:collapse}
    .delivery-table th,.delivery-table td{padding:9px 11px;border:1px solid #d8dde2;text-align:center}
    .delivery-table thead th{position:sticky;top:0;background:#18a957;color:#fff;font-size:10px;font-style:italic;z-index:2}
    .delivery-table td{font-size:10.5px}.delivery-table .driver{text-align:left;font-weight:800}
    .delivery-table tr.rank-first td{background:#fff200}.delivery-table tr.rank-second td{background:#fff3dc}
    .delivery-table tr.rank-third td{background:#f8ded3}.delivery-table tr.rank-zero td{background:#effbea}
    .delivery-table tfoot th{background:#dff4fa;font-size:11px;font-weight:950}
    .delivery-empty{padding:80px 20px;text-align:center;border:1px dashed #d7dce2;border-radius:15px;background:#fff;color:#77818c;font-size:11px;line-height:1.7}
    .delivery-empty b{display:block;color:#374151;font-size:14px}.delivery-empty-icon{width:48px;height:48px;margin:0 auto 10px;border-radius:14px;background:#fff0ec;color:#ee4d2d;display:grid;place-items:center;font-size:24px;font-weight:900}
    .preview-backdrop{position:fixed;inset:0;z-index:2147483647;background:#111827cc;display:grid;place-items:center;padding:24px}
    .preview-modal{width:min(1500px,96vw);height:min(94vh,1000px);background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 100px #0007}
    .preview-head{height:60px;flex:0 0 60px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e5e7eb}
    .preview-scroll{flex:1;overflow:auto;background:#25282d;padding:20px;text-align:center}.preview-scroll img{max-width:100%;height:auto;box-shadow:0 8px 30px #0005}
    @media(max-width:900px){.delivery-form{grid-template-columns:1fr}.delivery-flow{flex-wrap:wrap;height:auto;min-height:42px;padding:8px}.tabs{width:100%}.tab{flex:1}}

    @media(max-width:900px){.query,.tools{grid-template-columns:1fr}.arrow{height:15px;transform:rotate(90deg)}}
  `;
  shadow.appendChild(style);

  const modernStyle = document.createElement("style");
  modernStyle.id = "spx-modern-ui-v150";
  modernStyle.textContent = `
    :host{
      --spx-primary:#ff5a36;
      --spx-primary-2:#ff7a59;
      --spx-purple:#7657ff;
      --spx-cyan:#18b7c9;
      --spx-green:#17a673;
      --spx-amber:#f4a51c;
      --spx-ink:#17202b;
      --spx-muted:#73808e;
      --spx-line:rgba(27,39,53,.09);
      --spx-surface:rgba(255,255,255,.86);
      --spx-shadow:0 16px 46px rgba(31,41,55,.10);
      --spx-shadow-lg:0 28px 80px rgba(24,32,45,.18);
    }

    @keyframes spxFadeUp{
      from{opacity:0;transform:translateY(10px)}
      to{opacity:1;transform:translateY(0)}
    }
    @keyframes spxPulse{
      0%,100%{box-shadow:0 0 0 0 rgba(23,166,115,.22)}
      50%{box-shadow:0 0 0 7px rgba(23,166,115,0)}
    }
    @keyframes spxShimmer{
      0%{background-position:200% 0}
      100%{background-position:-200% 0}
    }

    .launch{
      width:42px;
      min-width:42px;
      height:42px;
      padding:0;
      border-radius:12px;
      background:transparent;
      box-shadow:0 12px 30px rgba(31,41,55,.20);
      transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
      position:relative;
      overflow:hidden;
    }
    .launch:hover{transform:translateY(-2px) scale(1.015);box-shadow:0 20px 48px rgba(238,77,45,.42)}
    .launch:active{transform:translateY(0) scale(.985)}

    .app{
      background:#fff;
    }

    .header{
      height:74px;
      flex-basis:74px;
      padding:0 24px;
      border-bottom:1px solid rgba(255,255,255,.72);
      background:rgba(255,255,255,.82);
      backdrop-filter:blur(18px) saturate(150%);
      -webkit-backdrop-filter:blur(18px) saturate(150%);
      box-shadow:0 1px 0 rgba(20,29,40,.06),0 8px 28px rgba(28,37,49,.04);
      position:relative;
      z-index:40;
    }
    .header::before{
      content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;
      background:#fff;
      opacity:.78;
    }
    .brand{gap:13px}
    .logo{
      width:44px;height:44px;border-radius:14px;
      background:#fff;
      box-shadow:0 10px 24px rgba(238,77,45,.25),inset 0 1px 0 rgba(255,255,255,.25);
      font-size:17px;
      transform:rotate(-2deg);
    }
    .title{font-size:18px;letter-spacing:-.025em;color:var(--spx-ink)}
    .sub{font-size:10.5px;color:#7a8592}
    .header-actions{display:flex;align-items:center;gap:8px}
    .session-pill,.version-pill{
      height:34px;padding:0 11px;border-radius:999px;display:flex;align-items:center;gap:7px;
      font-size:9.5px;font-weight:850;border:1px solid rgba(25,42,60,.08);background:rgba(255,255,255,.78);
      color:#596674;
    }
    .session-dot{width:8px;height:8px;border-radius:50%;background:#20b37a;animation:spxPulse 1.8s ease-in-out infinite}
    .version-pill{color:#7457d7;background:rgba(118,87,255,.08);border-color:rgba(118,87,255,.13)}
    .close{
      width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.88);
      transition:all .16s ease;color:#66717d;
    }
    .close:hover{background:#fff0ec;color:#d94a2b;border-color:#ffd5ca;transform:rotate(4deg)}

    .main{padding:16px 20px 20px;gap:14px}
    .tabs{
      position:sticky;top:0;z-index:35;
      width:max-content;max-width:100%;padding:5px;
      border:1px solid rgba(32,44,58,.08);
      background:rgba(239,242,246,.76);
      backdrop-filter:blur(14px);
      border-radius:14px;
      box-shadow:0 8px 24px rgba(31,41,55,.06);
    }
    .tab{
      min-width:150px;height:38px;border-radius:10px;font-size:10.5px;
      transition:all .2s ease;position:relative;overflow:hidden;
    }
    .tab:hover{color:#394452;background:rgba(255,255,255,.62);transform:translateY(-1px)}
    .tab.active{
      color:#fff;
      background:#fff;
      box-shadow:0 8px 20px rgba(238,77,45,.22);
    }

    .card,.delivery-result{
      border:1px solid rgba(37,50,65,.08);
      border-radius:18px;
      background:var(--spx-surface);
      backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);
      box-shadow:var(--spx-shadow);
      animation:spxFadeUp .28s ease both;
    }
    .cardhead,.delivery-result-head{
      min-height:58px;padding:12px 16px;
      border-bottom:1px solid rgba(37,50,65,.075);
      background:#fff;
      border-radius:18px 18px 0 0;
    }
    .cardtitle{font-size:13px;color:#2d3742;letter-spacing:-.01em}
    .hint{font-size:9.8px;color:#818b97;margin-top:2px}

    .query{padding:14px 16px;gap:12px}
    .label{font-size:9px;color:#74808d;letter-spacing:.08em}
    .input,.select,.pick{
      height:44px;border-radius:12px;border-color:rgba(38,51,65,.12);
      background:rgba(255,255,255,.92);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.55);
      transition:border-color .17s ease,box-shadow .17s ease,transform .17s ease;
    }
    .input:hover,.select:hover,.pick:hover{border-color:rgba(238,77,45,.32)}
    .input:focus,.select:focus,.pick:focus{
      border-color:rgba(238,77,45,.55);
      box-shadow:0 0 0 4px rgba(238,77,45,.09),0 8px 20px rgba(31,41,55,.05);
    }
    .pop{
      border-radius:15px;border-color:rgba(31,41,55,.10);
      box-shadow:0 22px 60px rgba(22,30,42,.18);
      backdrop-filter:blur(18px);background:rgba(255,255,255,.97);padding:7px;
    }
    .opt{border-radius:9px;transition:background .12s ease,transform .12s ease}
    .opt:hover{background:#fff3ef;transform:translateX(2px)}

    .primary{
      height:44px;border-radius:12px;
      background:#fff;
      box-shadow:0 10px 24px rgba(238,77,45,.22);
      transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;
      position:relative;overflow:hidden;
    }
    .primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(238,77,45,.30);filter:saturate(1.08)}
    .primary:active:not(:disabled){transform:translateY(0) scale(.985)}
    .ghostbtn{
      height:40px;border-radius:10px;background:rgba(255,255,255,.9);
      transition:all .16s ease;box-shadow:0 3px 10px rgba(31,41,55,.04);
    }
    .ghostbtn:hover:not(:disabled){transform:translateY(-1px);border-color:#ffc7b9;background:#fff7f4;color:#cf4d31;box-shadow:0 8px 18px rgba(31,41,55,.08)}

    .progress{
      position:relative;overflow:hidden;
      background:#fff;
      background-size:200% 100%;animation:spxShimmer 2s linear infinite;
      border-color:#f1d59a;color:#835a13;box-shadow:0 8px 22px rgba(244,165,28,.08);
    }
    .error{box-shadow:0 8px 22px rgba(169,45,72,.08)}

    .tools{padding:12px 14px;gap:10px;background:rgba(250,251,252,.62)}
    .meta{padding:10px 14px;background:rgba(247,249,251,.72)}
    .tablewrap,.delivery-table-wrap{scrollbar-color:#cfd5dc transparent;scrollbar-width:thin}
    table{border-spacing:0}
    th{
      background:#fff;
      color:#687380;letter-spacing:.055em;box-shadow:inset 0 -1px 0 rgba(40,52,65,.08);
    }
    td{transition:background .14s ease,transform .14s ease}
    tbody tr:nth-child(even) td{background:rgba(248,250,252,.56)}
    tbody tr:hover td{background:#fff7f3!important}
    tbody tr:hover td:first-child{box-shadow:inset 3px 0 0 var(--spx-primary)}
    .badge{
      padding:4px 7px;border-radius:8px;
      background:#fff;
      color:#c9482c;border:1px solid #ffd9cf;
    }
    .age{border:1px solid rgba(55,65,81,.08);background:#f7f8fa}
    .pager{height:50px;background:rgba(255,255,255,.74);border-radius:0 0 18px 18px}
    .pager button{transition:all .15s ease}
    .pager button:hover{border-color:#ffc8bb;background:#fff4f0;color:#cf4d31}

    .delivery-layout{gap:14px}
    .delivery-form{padding:16px;gap:14px}
    .delivery-flow{
      height:46px;border-radius:12px;border-color:rgba(118,87,255,.18);
      background:#fff;
      color:#637080;
    }
    .task-chip{
      padding:6px 10px;background:#fff;
      border:1px solid #ffd9cf;
    }
    .delivery-result-head{padding:13px 16px}
    .delivery-table thead th{
      background:#fff;
      box-shadow:inset 0 -1px 0 rgba(0,0,0,.08);
    }
    .delivery-table tbody tr{transition:filter .14s ease,transform .14s ease}
    .delivery-table tbody tr:hover{filter:saturate(1.06);transform:translateY(-1px)}
    .delivery-table tr.rank-first td{background:#fff;
      backdrop-filter:blur(12px) saturate(120%);
      -webkit-backdrop-filter:blur(12px) saturate(120%);
      animation:spxFadeUp .18s ease both;
    }
    .preview-modal{
      border-radius:20px;box-shadow:var(--spx-shadow-lg);
      border:1px solid rgba(255,255,255,.5);
    }
    .preview-head{background:#fff}
    .preview-scroll{background:#242930}
    .preview-scroll img{border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.36)}

    .seatalk-config{
      background:#fff;
      border-color:rgba(71,118,190,.16)!important;
      box-shadow:0 10px 30px rgba(36,89,169,.06);
    }
    .seatalk-send{
      background:#fff;
      border-color:#c8d9f4!important;color:#285da9!important;
    }
    .seatalk-send:hover:not(:disabled){background:#fff;box-shadow:0 8px 18px rgba(36,89,169,.12)}

    .stat-strip,.delivery-kpis{
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 14px;
      border-bottom:1px solid rgba(31,41,55,.07);
    }
    .stat-card{
      min-height:72px;padding:12px;border-radius:14px;border:1px solid rgba(31,41,55,.07);
      background:#fff;
      box-shadow:0 7px 20px rgba(31,41,55,.045);position:relative;overflow:hidden;
    }
    .stat-card::after{content:"";position:absolute;right:-18px;top:-22px;width:70px;height:70px;border-radius:50%;background:var(--stat-color,rgba(238,77,45,.08))}
    .stat-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#7d8793;font-weight:900}
    .stat-value{margin-top:6px;font-size:21px;line-height:1;font-weight:950;color:#26313d;letter-spacing:-.03em}
    .stat-note{margin-top:4px;font-size:9px;color:#87919c}
    .stat-orange{--stat-color:rgba(238,77,45,.12)}
    .stat-purple{--stat-color:rgba(118,87,255,.12)}
    .stat-green{--stat-color:rgba(23,166,115,.12)}
    .stat-amber{--stat-color:rgba(244,165,28,.14)}

    @media(max-width:1100px){
      .query{grid-template-columns:minmax(180px,1fr) 24px minmax(180px,1fr);}
      .query .field:nth-of-type(3){grid-column:1/-1}
      .query .primary{grid-column:1/-1}
      .tools{grid-template-columns:1fr 180px}
      .tools .select:last-child{grid-column:1/-1}
      .stat-strip,.delivery-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
    @media(max-width:720px){
      .header{height:66px;flex-basis:66px;padding:0 12px}
      .logo{width:38px;height:38px;border-radius:12px}
      .title{font-size:15px}.sub{display:none}
      .session-pill{display:none}.version-pill{height:30px;padding:0 9px}
      .main{padding:10px;gap:10px}
      .tabs{width:100%;display:grid;grid-template-columns:1fr 1fr;position:relative}
      .tab{min-width:0;width:100%;padding:0 8px;font-size:9.5px}
      .card,.delivery-result{border-radius:15px}
      .query,.tools,.delivery-form{grid-template-columns:1fr!important;padding:12px}
      .arrow{height:14px}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr 1fr;padding:10px}
      .stat-card{min-height:66px;padding:10px}.stat-value{font-size:18px}
      .delivery-actions{width:100%;display:grid;grid-template-columns:1fr 1fr}
      .delivery-actions .ghostbtn{width:100%}
      .preview-backdrop{padding:8px}.preview-modal{width:100%;height:96vh;border-radius:14px}
    }
    @media(max-width:460px){
      .header-actions .version-pill{display:none}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr}
      .delivery-actions{grid-template-columns:1fr}
      .tabs{grid-template-columns:1fr}
    }
  `;
  shadow.appendChild(modernStyle);

  // Layout fix v1.5.2: prevent navigation tabs from stretching vertically.
  const layoutFixStyle = document.createElement("style");
  layoutFixStyle.id = "spx-layout-fix-v152";
  layoutFixStyle.textContent = `
    .main{
      align-content:start!important;
      grid-auto-rows:max-content!important;
    }

    .tabs{
      align-self:start!important;
      min-height:48px!important;
      height:auto!important;
      flex:none!important;
    }

    .tab{
      align-self:center!important;
    }

    @media(max-width:720px){
      .main{
        display:block!important;
        padding:10px!important;
      }

      .tabs{
        position:relative!important;
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        width:100%!important;
        min-height:48px!important;
        height:48px!important;
        padding:5px!important;
        margin:0 0 10px!important;
        border-radius:14px!important;
      }

      .tab{
        width:100%!important;
        height:38px!important;
        min-height:38px!important;
        align-self:center!important;
      }

      .card,
      .delivery-layout,
      .delivery-result,
      .progress,
      .error{
        margin-top:10px!important;
      }
    }

    @media(max-width:460px){
      .tabs{
        grid-template-columns:1fr 1fr!important;
        height:48px!important;
      }

      .tab{
        padding:0 6px!important;
        font-size:9px!important;
        white-space:nowrap!important;
      }
    }
  `;
  shadow.appendChild(layoutFixStyle);

  const opsFteStyle = document.createElement("style");
  opsFteStyle.id = "uyen-ni-ops-fte-ui-v160";
  opsFteStyle.textContent = `
    :host{
      --ops-primary:#F53D2D;
      --ops-primary-hover:#D73223;
      --ops-secondary:#FF6A00;
      --ops-bg:#f5f6f8;
      --ops-surface:#ffffff;
      --ops-surface-2:#fafbfc;
      --ops-text:#1f2937;
      --ops-muted:#6b7280;
      --ops-line:rgba(15,23,42,.10);
      --ops-green:#169b68;
      --ops-amber:#b36b08;
      --ops-red:#b42348;
      --ops-shadow:0 1px 2px rgba(15,23,42,.04);
      font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif!important;
      color:var(--ops-text)!important;
    }

    *{box-sizing:border-box}
    button,a,input,select,textarea{touch-action:manipulation}
    .ui-icon{display:inline-block;vertical-align:middle;flex:0 0 auto}
    .icon-label{display:inline-flex;align-items:center;justify-content:center;gap:7px}
    .menu-btn,.close,.drawer-close,.page-icon,.logo,.drawer-logo,.nav-icon{line-height:0}
    .primary,.ghostbtn,.launch,.pager button{display:inline-flex;align-items:center;justify-content:center;gap:7px}
    .pick{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .title,.page-title,.cardtitle,.drawer-title{font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif!important}
    button:focus-visible,input:focus-visible,select:focus-visible{
      outline:3px solid rgba(245,61,45,.24)!important;
      outline-offset:2px;
    }

    .app{
      background:var(--ops-bg)!important;
      color:var(--ops-text)!important;
    }

    .header{
      height:56px!important;
      flex:0 0 56px!important;
      padding:0 10px 0 8px!important;
      background:rgba(255,255,255,.96)!important;
      border-bottom:1px solid var(--ops-line)!important;
      box-shadow:none!important;
      backdrop-filter:blur(14px)!important;
      -webkit-backdrop-filter:blur(14px)!important;
      position:sticky!important;
      top:0;
      z-index:80!important;
    }
    .header::before{display:none!important}
    .brand{min-width:0;gap:8px!important;flex:1}
    .menu-btn{
      width:44px;height:44px;flex:0 0 44px;
      border:0;border-radius:12px;background:transparent;color:#374151;
      display:grid;place-items:center;font-size:21px;font-weight:800;
      transition:background .14s ease,transform .14s ease;
    }
    .menu-btn:hover{background:#f1f3f5}
    .menu-btn:active{transform:scale(.96)}
    .logo{
      width:36px!important;height:36px!important;border-radius:12px!important;
      background:rgba(245,61,45,.10)!important;color:var(--ops-primary)!important;
      box-shadow:none!important;transform:none!important;font-size:15px!important;
    }
    .title{font-size:15px!important;font-weight:750!important;color:#20262e!important;letter-spacing:-.015em!important}
    .sub{font-size:9.5px!important;color:#7a8490!important;margin-top:1px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .header-actions{gap:5px!important}
    .session-pill{
      height:30px!important;padding:0 9px!important;background:#eefbf5!important;
      border:1px solid #d5eee3!important;color:#17734f!important;font-size:9px!important;
    }
    .session-dot{width:7px!important;height:7px!important;background:#1da86f!important;animation:none!important}
    .version-pill{display:none!important}
    .close{
      width:44px!important;height:44px!important;min-width:44px!important;
      border:0!important;background:transparent!important;border-radius:12px!important;
      color:#4b5563!important;font-size:20px!important;
    }
    .close:hover{background:#fff0ec!important;color:var(--ops-primary)!important;transform:none!important}

    .ops-main{
      flex:1;min-width:0;min-height:0;overflow:auto;
      background:rgba(229,231,235,.34);
      padding-bottom:max(24px,env(safe-area-inset-bottom));
    }
    .ops-page{
      width:100%;max-width:1280px;min-width:0;margin:0 auto;
      padding:18px 12px 28px;
    }
    .page-header{
      display:flex;align-items:flex-start;justify-content:space-between;gap:14px;
      padding:0 0 16px;margin-bottom:14px;border-bottom:1px solid var(--ops-line);
    }
    .page-heading{display:flex;align-items:flex-start;gap:10px;min-width:0}
    .page-icon{
      width:40px;height:40px;flex:0 0 40px;border-radius:14px;
      background:rgba(245,61,45,.10);color:var(--ops-primary);
      display:grid;place-items:center;font-size:18px;font-weight:900;
    }
    .page-title{
      margin:0;font-size:24px;line-height:1.15;font-weight:750;
      letter-spacing:-.02em;color:#20262e;overflow-wrap:anywhere;
    }
    .page-description{
      max-width:760px;margin-top:5px;font-size:12px;line-height:1.5;color:#6f7884;
    }
    .page-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}

    .drawer-overlay{
      position:fixed;inset:0;z-index:110;background:rgba(17,24,39,.36);
      opacity:0;pointer-events:none;transition:opacity .18s ease;
      backdrop-filter:blur(2px);
    }
    .drawer-overlay.open{opacity:1;pointer-events:auto}
    .drawer-panel{
      position:absolute;inset:0 auto 0 0;width:min(86vw,320px);
      background:#fff;box-shadow:18px 0 52px rgba(15,23,42,.18);
      transform:translateX(-102%);transition:transform .22s ease;
      display:flex;flex-direction:column;padding:16px;
    }
    .drawer-overlay.open .drawer-panel{transform:translateX(0)}
    .drawer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:15px;border-bottom:1px solid var(--ops-line)}
    .drawer-brand{display:flex;align-items:center;gap:10px;min-width:0}
    .drawer-logo{
      width:40px;height:40px;border-radius:14px;background:#fff;
      color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 8px 18px rgba(245,61,45,.18);
    }
    .drawer-title{font-size:14px;font-weight:750;color:#252b33}
    .drawer-sub{font-size:10px;color:#7a8490;margin-top:2px}
    .drawer-close{width:44px;height:44px;border:0;border-radius:50%;background:transparent;font-size:20px;color:#66707b}
    .drawer-close:hover{background:#f3f4f6}
    .drawer-nav{display:grid;gap:7px;margin-top:18px}
    .nav-item{
      width:100%;min-height:48px;border:0;border-radius:12px;background:transparent;color:#4c5663;
      display:flex;align-items:center;gap:11px;padding:0 13px;text-align:left;font-size:12px;font-weight:800;
      transition:background .14s ease,color .14s ease,transform .14s ease;
    }
    .nav-item:hover{background:#f3f4f6;transform:translateX(1px)}
    .nav-item.active{background:var(--ops-primary);color:#fff;box-shadow:0 8px 18px rgba(245,61,45,.18)}
    .nav-icon{width:28px;height:28px;border-radius:9px;background:rgba(127,127,127,.08);display:grid;place-items:center;font-size:14px}
    .nav-item.active .nav-icon{background:rgba(255,255,255,.16)}
    .drawer-footer{margin-top:auto;padding-top:14px;border-top:1px solid var(--ops-line);font-size:10px;color:#7b8490;line-height:1.55}
    .drawer-status{display:flex;align-items:center;gap:7px;color:#17734f;font-weight:800;margin-bottom:5px}
    .drawer-status-dot{width:7px;height:7px;border-radius:50%;background:#20a86f}

    .tabs{display:none!important}
    .main{display:block!important;padding:0!important;overflow:visible!important}

    .card,.delivery-result{
      background:#fff!important;border:1px solid var(--ops-line)!important;
      border-radius:16px!important;box-shadow:var(--ops-shadow)!important;
      backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
      animation:none!important;
    }
    .cardhead,.delivery-result-head{
      min-height:58px!important;padding:13px 15px!important;background:#fff!important;
      border-bottom:1px solid var(--ops-line)!important;border-radius:16px 16px 0 0!important;
    }
    .cardtitle{font-size:15px!important;font-weight:900!important;color:#2b323b!important}
    .hint{font-size:11px!important;line-height:1.45!important;color:#78828d!important}
    .label{font-size:11px!important;text-transform:none!important;letter-spacing:0!important;color:#4f5965!important;font-weight:700!important}
    .input,.select,.pick{
      height:44px!important;border-radius:12px!important;background:#fff!important;
      border:1px solid #d9dee5!important;color:#303740!important;font-size:13px!important;
      box-shadow:none!important;
    }
    .input:hover,.select:hover,.pick:hover{border-color:#bdc5cf!important}
    .input:focus,.select:focus,.pick:focus{border-color:#f38976!important;box-shadow:0 0 0 3px rgba(245,61,45,.09)!important}
    .primary{
      min-height:44px!important;border-radius:12px!important;background:var(--ops-primary)!important;
      box-shadow:none!important;font-size:12px!important;font-weight:800!important;
    }
    .primary:hover:not(:disabled){background:var(--ops-primary-hover)!important;transform:none!important;box-shadow:none!important}
    .ghostbtn{min-height:44px!important;height:44px!important;border-radius:12px!important;font-size:11px!important;box-shadow:none!important}
    .ghostbtn:hover:not(:disabled){transform:none!important;background:#f8f9fa!important;border-color:#cfd5dc!important;color:#38414b!important;box-shadow:none!important}

    .query{
      padding:15px!important;
      grid-template-columns:minmax(210px,1fr) 28px minmax(210px,1fr) minmax(300px,1.3fr) 150px!important;
      gap:10px!important;
    }
    .tools{padding:12px!important;background:#fff!important}
    .meta{background:#fafbfc!important;font-size:11px!important;padding:9px 12px!important}
    .pop{top:68px!important;border-radius:14px!important;box-shadow:0 18px 45px rgba(15,23,42,.16)!important}
    .opt{min-height:38px!important;font-size:11px!important}
    .status-search-wrap{position:sticky;top:-6px;z-index:2;background:#fff;padding:6px 0 8px;border-bottom:1px solid #edf0f2;margin-bottom:4px}
    .status-search{height:40px!important}

    .stat-strip,.delivery-kpis{padding:12px!important;gap:8px!important;background:#fafbfc}
    .stat-card{min-height:76px!important;padding:12px!important;border-radius:14px!important;border:1px solid var(--ops-line)!important;background:#fff!important;box-shadow:none!important}
    .stat-card::after{display:none!important}
    .stat-label{font-size:10px!important;color:#7a8490!important}
    .stat-value{font-size:21px!important;color:#242b33!important}
    .stat-note{font-size:10px!important;color:#89929d!important}

    .tablewrap,.delivery-table-wrap{overflow:auto!important}
    th{background:#f8f9fb!important;color:#65717e!important;font-size:10px!important}
    td{font-size:12px!important;color:#4a5562!important}
    tbody tr:nth-child(even) td{background:#fbfcfd!important}
    tbody tr:hover td{background:#fff7f4!important}
    .badge{background:#fff0ec!important;border:0!important;color:#c6462a!important}
    .small{font-size:10px!important;color:#7e8894!important}
    .pager{height:50px!important;font-size:11px!important}

    .fms-mobile-list{display:none}
    .fms-mobile-card{
      border:1px solid var(--ops-line);border-radius:14px;background:#fff;padding:12px;
      display:grid;gap:10px;box-shadow:var(--ops-shadow);
    }
    .fms-mobile-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .fms-mobile-spx{font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif;font-size:12px;font-weight:800;color:#252c34;overflow-wrap:anywhere}
    .fms-mobile-to{font-size:10px;color:#7b8490;margin-top:3px;overflow-wrap:anywhere}
    .fms-mobile-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .fms-mobile-item{min-width:0;padding:9px;border-radius:10px;background:#f8f9fb}
    .fms-mobile-label{font-size:9px;text-transform:uppercase;color:#8a939d;font-weight:800;letter-spacing:.04em}
    .fms-mobile-value{margin-top:4px;font-size:11px;color:#3e4751;font-weight:700;overflow-wrap:anywhere}

    .delivery-form{padding:15px!important;grid-template-columns:220px minmax(360px,1fr) auto!important;gap:12px!important}
    .delivery-flow{background:#fafbfc!important;border-color:#dce1e7!important;color:#66717d!important}
    .delivery-result-head{flex-wrap:wrap}
    .delivery-table tr.rank-first td{background:#fff8d6!important}
    .delivery-table tr.rank-second td{background:#fafbfc!important}
    .delivery-table tr.rank-third td{background:#fff4ed!important}
    .delivery-table tr.rank-zero td{background:#fff!important}
    .delivery-table thead th{background:#169b68!important;color:#fff!important}

    .progress,.error{font-size:11px!important;box-shadow:none!important}
    .progress{animation:none!important;background:#fff8e8!important}

    .preview-backdrop{background:rgba(15,23,42,.58)!important;backdrop-filter:blur(8px)!important}
    .preview-modal{border-radius:18px!important;box-shadow:0 24px 70px rgba(15,23,42,.26)!important}

    @media(min-width:768px){
      .ops-page{padding:24px 24px 32px}
      .page-title{font-size:30px}
      .header{padding:0 18px!important}
      .menu-btn{margin-right:2px}
    }
    @media(max-width:1023px){
      .query{grid-template-columns:1fr 24px 1fr!important}
      .query .field:nth-of-type(3){grid-column:1/-1}
      .query .primary{grid-column:1/-1;width:100%}
      .delivery-form{grid-template-columns:1fr!important}
      .delivery-form-actions{justify-content:flex-end}
    }
    @media(max-width:767px){
      .session-pill{display:none!important}
      .ops-page{padding:14px 12px calc(88px + env(safe-area-inset-bottom))}
      .page-header{align-items:flex-start}
      .page-title{font-size:23px}
      .page-description{font-size:11px}
      .page-actions{width:100%}
      .page-actions .primary{width:100%}
      .query{grid-template-columns:1fr!important;padding:12px!important}
      .query .field:nth-of-type(3),.query .primary{grid-column:auto}
      .arrow{height:18px!important;transform:rotate(90deg)}
      .tools{grid-template-columns:1fr!important}
      .tablewrap{display:none!important}
      .fms-mobile-list{display:grid;gap:10px;padding:10px;background:#f7f8fa}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr 1fr!important}
      .delivery-actions{width:100%;display:grid!important;grid-template-columns:1fr 1fr}
      .delivery-actions .ghostbtn{width:100%}
      .delivery-form-actions{
        position:sticky;bottom:8px;z-index:25;padding:8px;
        border:1px solid var(--ops-line);border-radius:14px;
        background:rgba(255,255,255,.94);backdrop-filter:blur(14px);
        box-shadow:0 14px 32px rgba(15,23,42,.14);
      }
      .delivery-form-actions>*{flex:1}
      .delivery-table{min-width:760px!important}
    }
    @media(max-width:460px){
      .brand .logo{display:none!important}
      .title{font-size:14px!important}
      .stat-strip,.delivery-kpis{grid-template-columns:1fr!important}
      .fms-mobile-grid{grid-template-columns:1fr}
      .delivery-actions{grid-template-columns:1fr}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
    }
  `;
  shadow.appendChild(opsFteStyle);

  const pickupStyle = document.createElement("style");
  pickupStyle.id = "spx-pickup-assignment-style";
  pickupStyle.textContent = `
    .pickup-layout{display:grid;gap:14px}
    .pickup-controls{padding:14px;display:grid;grid-template-columns:minmax(180px,220px) minmax(180px,220px) 1fr auto;gap:12px;align-items:end}
    .pickup-control-note{font-size:10px;color:#7b8490;line-height:1.55;padding:2px 0 3px}
    .pickup-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end}
    .pickup-result{overflow:hidden}
    .pickup-result-head{padding:12px 14px;border-bottom:1px solid #e7e9ed;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff}
    .pickup-table-wrap{overflow:auto;max-height:calc(100vh - 340px);min-height:260px}
    .pickup-table{width:100%;min-width:1320px;border-collapse:separate;border-spacing:0;table-layout:fixed}
    .pickup-table th,.pickup-table td{padding:8px 7px;border-bottom:1px solid #edf0f2;vertical-align:top}
    .pickup-table thead th{top:0;z-index:4;height:38px}
    .pickup-driver-filter{width:min(260px,100%);height:36px;border:1px solid #dfe3e8;border-radius:9px;background:#fff;padding:0 10px;font-size:10px;color:#3f4853;outline:0}
    .pickup-driver-filter:focus{border-color:#f58b75;box-shadow:0 0 0 2px rgba(245,61,45,.10)}
    .pickup-id{font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif;font-weight:800;color:#30363d;white-space:nowrap}
    .pickup-address{line-height:1.4;overflow-wrap:anywhere}
    .pickup-point{font-weight:700;color:#374151;overflow-wrap:anywhere}
    .pickup-driver{font-weight:800;color:#374151;overflow-wrap:anywhere}
    .pickup-attempt{text-align:center;font-weight:800}
    .pickup-eta{white-space:nowrap;font-weight:700}
    .pickup-sub{margin-top:3px;font-size:9px;color:#8a929c;line-height:1.35}
    .pickup-type{display:inline-flex;padding:3px 7px;border-radius:999px;background:#fff1ed;color:#c7482d;font-size:9px;font-weight:900;white-space:nowrap}
    .pickup-type.reverse{background:#f2edff;color:#6c4ccf}
    .pickup-reason{min-width:220px;line-height:1.4}
    .pickup-pager{height:50px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:#727b86;background:#fff}
    .pickup-pager button{height:30px;border:1px solid #e0e3e7;border-radius:8px;background:#fff;display:inline-flex;align-items:center;gap:5px}
    .pickup-pager button:disabled{opacity:.45;cursor:not-allowed}
    .pickup-empty{padding:64px 20px;text-align:center;color:#7a838e;font-size:11px}
    @media(max-width:1023px){
      .pickup-controls{grid-template-columns:1fr 1fr}
      .pickup-controls .pickup-control-note{grid-column:1/-1}
      .pickup-actions{justify-content:stretch}
      .pickup-actions>*{flex:1}
      .pickup-table-wrap{max-height:none}
    }
    @media(max-width:640px){
      .pickup-controls{grid-template-columns:1fr}
      .pickup-result-head{align-items:flex-start;flex-direction:column}
      .pickup-pager{height:auto;min-height:50px;padding:10px;gap:8px;flex-direction:column;align-items:stretch}
      .pickup-pager>span:last-child{display:flex;align-items:center;justify-content:space-between}
    }
  `;
  shadow.appendChild(pickupStyle);


  const designSystemStyle = document.createElement("style");
  designSystemStyle.id = "spx-design-system-v180";
  designSystemStyle.textContent = `
    :host{
      --ds-color-brand:#f53d2d;--ds-color-brand-hover:#d73223;--ds-color-brand-soft:#fff1ed;
      --ds-color-text:#1f2937;--ds-color-text-2:#4b5563;--ds-color-muted:#77818d;
      --ds-color-border:#e2e6eb;--ds-color-surface:#fff;--ds-color-surface-2:#f8fafc;--ds-color-canvas:#f3f5f7;
      --ds-space-1:4px;--ds-space-2:8px;--ds-space-3:12px;--ds-space-4:16px;--ds-space-5:20px;--ds-space-6:24px;--ds-space-8:32px;
      --ds-radius-sm:10px;--ds-radius-md:14px;--ds-radius-lg:18px;--ds-radius-xl:24px;
      --ds-control-h:44px;--ds-shadow-sm:0 1px 2px rgba(15,23,42,.05);--ds-shadow-md:0 10px 30px rgba(15,23,42,.08);--ds-shadow-lg:0 24px 70px rgba(15,23,42,.20);
      font-family:"Be Vietnam Pro","Segoe UI",Arial,sans-serif!important;
    }
    .launch{width:42px!important;min-width:42px!important;height:42px!important;padding:0!important;border-radius:12px!important;background:transparent!important;box-shadow:0 10px 26px rgba(15,23,42,.18)!important}
    .launch-icon{width:42px!important;height:42px!important;border-radius:12px!important}
    .app{background:var(--ds-color-canvas)!important}
    .header{height:60px!important;flex-basis:60px!important;padding-left:max(10px,env(safe-area-inset-left))!important;padding-right:max(10px,env(safe-area-inset-right))!important;background:rgba(255,255,255,.96)!important;border-bottom:1px solid var(--ds-color-border)!important}
    .app-brand-icon{width:100%;height:100%;display:block;object-fit:cover;border-radius:inherit}
    .drawer-logo{overflow:hidden!important;background:transparent!important;padding:0!important;box-shadow:none!important}
    .drawer-logo{width:40px!important;height:40px!important}
    .title{font-size:15px!important;font-weight:800!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .menu-btn,.close,.drawer-close{min-width:44px!important;min-height:44px!important}
    .ops-main{overscroll-behavior:contain;scrollbar-gutter:stable;padding-bottom:max(var(--ds-space-6),env(safe-area-inset-bottom))!important}
    .ops-page{width:min(100%,1440px)!important;max-width:1440px!important;padding:clamp(14px,2vw,28px)!important}
    .page-header{min-height:48px;margin:0 0 var(--ds-space-4)!important;padding:0 0 var(--ds-space-4)!important;align-items:center!important}
    .page-heading{align-items:center!important;gap:var(--ds-space-3)!important}.page-icon{width:38px!important;height:38px!important;flex-basis:38px!important;border-radius:12px!important}.page-title{font-size:clamp(21px,2.2vw,30px)!important;font-weight:800!important;line-height:1.2!important}
    .drawer-panel{width:min(320px,calc(100vw - 24px))!important;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))!important}
    .nav-item{min-height:48px!important;border-radius:var(--ds-radius-md)!important;font-size:13px!important}.drawer-footer{font-size:11px!important}
    .card,.delivery-result{border:1px solid var(--ds-color-border)!important;border-radius:var(--ds-radius-lg)!important;box-shadow:var(--ds-shadow-sm)!important;overflow:hidden}
    .fms-filter-card{overflow:visible!important;position:relative;z-index:30}
    .fms-filter-card .query{overflow:visible!important}
    .fms-filter-card .field:has([data-picker]){z-index:35}
    .fms-filter-card .pop{z-index:1000!important}
    .cardhead,.delivery-result-head,.pickup-result-head{min-height:56px!important;padding:var(--ds-space-3) var(--ds-space-4)!important;border-bottom:1px solid var(--ds-color-border)!important;background:var(--ds-color-surface)!important}
    .cardtitle{font-size:14px!important;font-weight:800!important}.hint{font-size:11px!important}.field{gap:6px!important}.label{font-size:11px!important;font-weight:700!important}
    .input,.select,.pick,.pickup-driver-filter{min-height:var(--ds-control-h)!important;height:var(--ds-control-h)!important;border:1px solid #d8dde4!important;border-radius:12px!important;background:#fff!important;color:var(--ds-color-text)!important;font-size:13px!important;box-shadow:none!important}
    .input,.select{padding-left:12px!important;padding-right:12px!important}.pick{padding:0 12px!important}
    .input:focus,.select:focus,.pick:focus,.pickup-driver-filter:focus{border-color:#f28c78!important;box-shadow:0 0 0 3px rgba(245,61,45,.10)!important}
    .primary,.ghostbtn{min-height:var(--ds-control-h)!important;height:var(--ds-control-h)!important;border-radius:12px!important;font-size:12px!important;font-weight:800!important}
    .primary{background:var(--ds-color-brand)!important}.primary:hover:not(:disabled){background:var(--ds-color-brand-hover)!important}.ghostbtn{background:#fff!important;border:1px solid var(--ds-color-border)!important}button:disabled{cursor:not-allowed!important;opacity:.5!important}
    .query{padding:var(--ds-space-4)!important;gap:var(--ds-space-3)!important;grid-template-columns:minmax(190px,1fr) 28px minmax(190px,1fr) minmax(260px,1.35fr) 150px!important}
    .tools{padding:var(--ds-space-3)!important;gap:var(--ds-space-2)!important;grid-template-columns:minmax(260px,1fr) minmax(150px,190px) minmax(220px,300px)!important}
    .meta{font-size:11px!important;gap:var(--ds-space-3)!important;flex-wrap:wrap}.pop{max-height:min(420px,60vh)!important}
    .stat-strip,.delivery-kpis{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:var(--ds-space-2)!important;padding:var(--ds-space-3)!important;background:var(--ds-color-surface-2)!important}
    .stat-card{min-width:0!important;min-height:78px!important;padding:var(--ds-space-3)!important;border-radius:var(--ds-radius-md)!important}.stat-value{font-size:clamp(19px,2vw,24px)!important}.stat-label{font-size:10px!important}
    .tablewrap,.delivery-table-wrap,.pickup-table-wrap{width:100%;overflow:auto!important;-webkit-overflow-scrolling:touch;scrollbar-width:thin;overscroll-behavior-inline:contain}th,td{line-height:1.45!important}th{font-size:10px!important}td{font-size:12px!important}
    .pager,.pickup-pager{min-height:52px!important;height:auto!important;padding:10px 12px!important;gap:10px!important;flex-wrap:wrap!important;background:#fff!important}.pager button,.pickup-pager button{min-height:36px!important;padding:0 10px!important}
    .delivery-form,.pickup-controls{padding:var(--ds-space-4)!important;gap:var(--ds-space-3)!important}.delivery-form{grid-template-columns:minmax(180px,220px) 1fr auto!important}.pickup-controls{grid-template-columns:minmax(180px,220px) minmax(180px,220px) 1fr auto!important}
    .delivery-form-actions,.pickup-actions{display:flex;gap:var(--ds-space-2)!important;align-items:center}.delivery-result-head,.pickup-result-head{gap:var(--ds-space-3)!important;flex-wrap:wrap}.delivery-actions{display:flex!important;gap:var(--ds-space-2)!important;flex-wrap:wrap}
    .fms-mobile-list,.pickup-mobile-list,.delivery-mobile-list{display:none}
    .mobile-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.mobile-card-title{font-size:13px;font-weight:800;color:#252c34;overflow-wrap:anywhere}.mobile-card-sub{margin-top:3px;font-size:11px;color:var(--ds-color-muted);overflow-wrap:anywhere}
    .rank-chip{min-width:36px;height:28px;padding:0 8px;border-radius:999px;background:var(--ds-color-brand-soft);color:#c7462c;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:900}
    .mobile-metric-grid,.pickup-mobile-primary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mobile-metric,.pickup-mobile-primary>div,.mobile-detail{min-width:0;padding:10px;border-radius:12px;background:var(--ds-color-surface-2)}
    .mobile-metric span,.pickup-mobile-primary span,.mobile-detail span{display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#89929c}.mobile-metric b,.pickup-mobile-primary b,.mobile-detail b{display:block;margin-top:4px;font-size:12px;color:#38414b;overflow-wrap:anywhere}
    .mobile-detail{margin-top:8px}.pickup-mobile-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--ds-color-border);font-size:10px;color:var(--ds-color-muted)}
    .preview-backdrop{padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))!important}.preview-modal{width:min(1500px,100%)!important;height:min(94dvh,1000px)!important}.preview-head{min-height:56px!important;height:auto!important;padding:10px 12px!important}.preview-scroll{padding:clamp(8px,2vw,20px)!important}
    @media(max-width:1199px){.query{grid-template-columns:1fr 28px 1fr!important}.query .field:nth-of-type(3){grid-column:1/-1}.query .primary{grid-column:1/-1;width:100%}.delivery-form,.pickup-controls{grid-template-columns:1fr 1fr!important}.delivery-form>div:nth-child(2),.pickup-controls>div:nth-child(3){display:none}.delivery-form-actions,.pickup-actions{grid-column:1/-1;justify-content:flex-end}.tools{grid-template-columns:minmax(220px,1fr) minmax(150px,180px)!important}.tools .select:last-child{grid-column:1/-1}}
    @media(max-width:767px){:host{--ds-control-h:46px}.header{height:58px!important;flex-basis:58px!important}.brand{gap:7px!important}.title{font-size:14px!important}.ops-page{padding:12px 10px calc(20px + env(safe-area-inset-bottom))!important}.page-header{margin-bottom:12px!important;padding-bottom:12px!important}.page-icon{width:34px!important;height:34px!important;flex-basis:34px!important}.page-title{font-size:21px!important}.card,.delivery-result{border-radius:15px!important}.cardhead,.delivery-result-head,.pickup-result-head{padding:11px 12px!important}.query,.tools,.delivery-form,.pickup-controls{grid-template-columns:1fr!important;padding:12px!important}.query .field:nth-of-type(3),.query .primary,.delivery-form-actions,.pickup-actions{grid-column:auto!important}.arrow{height:16px!important;transform:rotate(90deg)}.delivery-form>div:nth-child(2),.pickup-controls>div:nth-child(3){display:none}.delivery-form-actions,.pickup-actions{justify-content:stretch!important}.delivery-form-actions>*,.pickup-actions>*{flex:1 1 0}.tools .select:last-child{grid-column:auto}.meta{display:grid!important;grid-template-columns:1fr!important}.stat-strip,.delivery-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:10px!important}.stat-card{min-height:70px!important;padding:10px!important}.stat-value{font-size:19px!important}.tablewrap,.delivery-table-wrap,.pickup-table-wrap{display:none!important}.fms-mobile-list,.pickup-mobile-list,.delivery-mobile-list{display:grid!important;grid-template-columns:1fr;gap:10px;padding:10px;background:#f7f8fa}.pickup-mobile-card,.delivery-mobile-card{border:1px solid var(--ds-color-border);border-radius:14px;background:#fff;padding:12px;box-shadow:var(--ds-shadow-sm)}.delivery-mobile-card.rank-first{border-color:#ecd45a;background:#fffdf0}.delivery-mobile-card.rank-second{background:#fbfcfd}.delivery-mobile-card.rank-third{background:#fff7f2}.delivery-mobile-card.rank-zero{background:#fbfef9}.pickup-driver-filter{width:100%!important}.delivery-actions{width:100%;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}.delivery-actions .ghostbtn{width:100%}.pager,.pickup-pager{align-items:stretch!important}.pager>span:last-child,.pickup-pager>span:last-child{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px}.preview-backdrop{padding:0!important}.preview-modal{width:100%!important;height:100dvh!important;max-height:none!important;border-radius:0!important;border:0!important}.preview-head{padding-top:max(10px,env(safe-area-inset-top))!important;padding-left:max(12px,env(safe-area-inset-left))!important;padding-right:max(12px,env(safe-area-inset-right))!important}.preview-scroll{padding:8px!important}}
    @media(max-width:420px){.title{font-size:13px!important}.menu-btn,.close{min-width:40px!important;width:40px!important}.stat-strip,.delivery-kpis{grid-template-columns:1fr 1fr!important;gap:7px!important}.stat-card{min-height:66px!important}.stat-label{font-size:9px!important}.stat-value{font-size:18px!important}.delivery-actions{grid-template-columns:1fr!important}.pager,.pickup-pager{font-size:10px!important}}
    @media(min-width:1600px){.ops-page{max-width:1500px!important}.query{grid-template-columns:260px 28px 260px minmax(360px,1fr) 160px!important}}
    @media(pointer:coarse){.nav-item,.primary,.ghostbtn,.input,.select,.pick,.pickup-driver-filter{min-height:48px!important}.opt{min-height:44px!important}}
    @media(hover:none){.nav-item:hover,.primary:hover,.ghostbtn:hover,tbody tr:hover td{transform:none!important}}
    @media(prefers-contrast:more){.card,.delivery-result,.pickup-mobile-card,.delivery-mobile-card,.fms-mobile-card{border-color:#b7bec8!important}.input,.select,.pick,.pickup-driver-filter{border-color:#aeb7c3!important}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  `;
  shadow.appendChild(designSystemStyle);

  const dashboardStyle = document.createElement("style");
  dashboardStyle.id = "spx-notion-paper-theme-v191";
  dashboardStyle.textContent = `
    :host{
      --dash-ink:#111;--dash-muted:#757575;--dash-line:rgba(0,0,0,.08);
      --dash-canvas:#f6f5f4;--dash-blue:#0075de;--dash-blue-hover:#0067c5;
      --dash-blue-wash:#e6f3fe;--dash-sidebar:#f6f5f4;
      font-family:Inter,"Segoe UI",Arial,sans-serif!important;color:#111!important;
    }
    .app{display:grid!important;grid-template-columns:248px minmax(0,1fr);grid-template-rows:64px minmax(0,1fr);background:var(--dash-canvas)!important}
    .header{grid-column:1/-1;grid-row:1;height:64px!important;flex-basis:64px!important;padding:0 28px!important;border-bottom:1px solid var(--dash-line)!important;background:#fff!important;box-shadow:none!important;z-index:90!important}
    .menu-btn{display:none!important}
    .brand{gap:12px!important}
    .brand::before{content:"X";width:34px;height:34px;border:1px solid var(--dash-line);border-radius:8px;background:#fff;color:#111;display:grid;place-items:center;font-size:17px;font-weight:800}
    .title{font-size:15px!important;letter-spacing:-.02em;color:var(--dash-ink)!important}
    .title span{color:#111!important}
    .header-actions::before{content:"OPERATIONS";font-size:9px;font-weight:600;letter-spacing:.12em;color:#757575;margin-right:15px}
    .close{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;border:1px solid var(--dash-line)!important;border-radius:8px!important;background:#fff!important;color:#111!important}
    .drawer-overlay{position:relative!important;inset:auto!important;grid-column:1;grid-row:2;z-index:1!important;opacity:1!important;pointer-events:auto!important;background:var(--dash-sidebar)!important;backdrop-filter:none!important}
    .drawer-panel{position:sticky!important;inset:auto!important;top:0;width:248px!important;height:calc(100vh - 64px);padding:24px 15px!important;background:var(--dash-sidebar)!important;box-shadow:none!important;transform:none!important;transition:none!important}
    .drawer-head{padding:2px 8px 22px!important;border-color:var(--dash-line)!important}
    .drawer-brand{gap:11px!important}.drawer-logo{width:38px!important;height:38px!important;flex:0 0 38px;border-radius:8px!important}
    .drawer-title{font-size:12px!important;color:#111!important}.drawer-sub{color:#757575!important}
    .drawer-close{display:none!important}
    .drawer-nav{gap:6px!important;margin-top:22px!important}
    .nav-item{min-height:44px!important;padding:0 11px!important;border-radius:8px!important;color:rgba(0,0,0,.58)!important;font-size:12px!important;font-weight:500!important}
    .nav-item:hover{background:rgba(0,0,0,.04)!important;color:#111!important;transform:none!important}
    .nav-item.active{background:var(--dash-blue-wash)!important;color:var(--dash-blue)!important;box-shadow:none!important}
    .nav-item.active .nav-icon{background:transparent!important;color:var(--dash-blue)!important}
    .nav-icon{background:transparent!important}
    .drawer-footer{padding:14px 10px 0!important;border-color:var(--dash-line)!important;color:#757575!important}
    .ops-main{grid-column:2;grid-row:2;min-width:0;min-height:0;background:var(--dash-canvas)!important}
    .ops-page{max-width:1440px!important;padding:30px 34px 42px!important}
    .page-header{min-height:76px!important;margin-bottom:22px!important;padding-bottom:20px!important;border-color:var(--dash-line)!important}
    .page-heading{align-items:flex-start!important;gap:14px!important}
    .page-icon{width:46px!important;height:46px!important;flex-basis:46px!important;border-radius:8px!important;background:var(--dash-blue-wash)!important;color:var(--dash-blue)!important}
    .page-title{font-size:27px!important;letter-spacing:-.035em!important;color:#111!important}
    .page-title::before{content:"OPERATIONS / ";display:block;margin-bottom:6px;color:#757575;font-size:9px;line-height:1.2;font-weight:600;letter-spacing:.12em}
    .card,.delivery-result{border:1px solid var(--dash-line)!important;border-radius:12px!important;box-shadow:none!important;background:#fff!important}
    .cardhead,.delivery-result-head,.pickup-result-head{min-height:60px!important;padding:15px 18px!important}
    .cardtitle{font-size:14px!important}
    .stat-strip,.delivery-kpis{gap:12px!important;padding:15px!important;background:#fff!important;border-bottom:1px solid var(--dash-line)!important}
    .stat-card{position:relative!important;min-height:88px!important;padding:15px!important;border:1px solid var(--dash-line)!important;border-radius:8px!important;background:#fff!important;box-shadow:none!important}
    .stat-card::before{content:none!important}
    .stat-card:nth-child(2){background:#e6f3fe!important}.stat-card:nth-child(3){background:#fff4d6!important}.stat-card:nth-child(4){background:#fce9e5!important}
    .stat-label{font-size:10px!important;letter-spacing:.01em!important;color:#615d59!important}.stat-value{margin-top:9px!important;font-size:25px!important;font-weight:700!important;letter-spacing:-.035em!important;color:#111!important}
    .query,.delivery-form,.pickup-controls{padding:18px!important}
    .tools{padding:13px 16px!important}
    .tablewrap,.pickup-table-wrap,.delivery-table-wrap{border-top:1px solid #eff1f3}
    .primary{background:var(--dash-blue)!important;border-radius:8px!important;color:#fff!important;box-shadow:none!important;font-weight:500!important}
    .primary:hover:not(:disabled){background:var(--dash-blue-hover)!important}
    .ghostbtn{border-radius:8px!important;background:var(--dash-blue-wash)!important;border-color:transparent!important;color:var(--dash-blue)!important;font-weight:500!important}
    .ghostbtn:hover:not(:disabled){background:#d8edfc!important;color:#0067c5!important}
    .input,.select,.pick,.pickup-driver-filter{border-radius:8px!important}
    .badge,.task-chip,.pickup-type,.rank-chip{border-radius:9999px!important}
    .badge{background:#e6f3fe!important;color:#0075de!important}
    .tab.active{background:#0075de!important;color:#fff!important;box-shadow:none!important}
    .delivery-table thead th{background:#f6f5f4!important;color:#111!important}
    th{background:#f6f5f4!important}tbody tr:hover td{background:#e6f3fe!important}
    .progress{background:#fff4d6!important;border-color:#f0d99f!important;color:#615d59!important;animation:none!important}
    .error{background:#fce9e5!important;border-color:#f2c7bd!important;color:#8c2a1a!important}
    @media(max-width:900px){.app{grid-template-columns:210px minmax(0,1fr)}.drawer-panel{width:210px!important;padding:20px 11px!important}.ops-page{padding:22px 20px 32px!important}.header{padding:0 20px!important}}
    @media(max-width:767px){
      .app{display:flex!important;flex-direction:column!important}
      .header{height:58px!important;flex:0 0 58px!important;padding:0 10px!important}
      .menu-btn{display:grid!important}
      .brand::before{display:none}
      .header-actions::before{display:none}
      .close{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important}
      .drawer-overlay{position:fixed!important;inset:0!important;grid-column:auto;grid-row:auto;z-index:110!important;background:rgba(17,24,39,.42)!important;opacity:0!important;pointer-events:none!important;transition:opacity .18s ease!important}
      .drawer-overlay.open{opacity:1!important;pointer-events:auto!important}
      .drawer-panel{position:absolute!important;inset:0 auto 0 0!important;width:min(300px,86vw)!important;height:100%!important;padding:16px!important;background:#fff!important;box-shadow:0 4px 12px rgba(0,0,0,.10)!important;transform:translateX(-102%)!important;transition:transform .2s ease!important}
      .drawer-overlay.open .drawer-panel{transform:translateX(0)!important}
      .drawer-head{border-color:var(--dash-line)!important}.drawer-title{color:#111!important}.drawer-close{display:grid!important;place-items:center}
      .drawer-nav{margin-top:18px!important}.nav-item{color:rgba(0,0,0,.58)!important}.nav-item:hover{background:rgba(0,0,0,.04)!important;color:#111!important}.nav-item.active{background:#e6f3fe!important;color:#0075de!important;box-shadow:none!important}.nav-item.active .nav-icon{background:transparent!important;color:#0075de!important}.nav-icon{background:transparent!important}
      .drawer-footer{border-color:var(--dash-line)!important;color:#757575!important}
      .ops-main{flex:1;min-height:0}.ops-page{padding:18px 12px calc(22px + env(safe-area-inset-bottom))!important}
      .page-header{min-height:60px!important;margin-bottom:15px!important;padding-bottom:14px!important}.page-heading{align-items:center!important}.page-icon{width:38px!important;height:38px!important;flex-basis:38px!important}.page-title{font-size:22px!important}.page-title::before{font-size:8px!important;margin-bottom:4px}
      .stat-strip,.delivery-kpis{gap:8px!important;padding:10px!important}.stat-card{min-height:72px!important;padding:11px!important}.stat-value{font-size:20px!important}
    }
  `;
  shadow.appendChild(dashboardStyle);

  const shadcnStyle = document.createElement("style");
  shadcnStyle.id = "spx-shadcn-theme-v200";
  shadcnStyle.textContent = `
    :host{
      --sc-background:#fff9fc;--sc-foreground:#181116;--sc-card:#fff;
      --sc-muted:#fff0f6;--sc-muted-foreground:#806b76;
      --sc-border:#f1d5e1;--sc-input:#efd3df;--sc-primary:#db2777;
      --sc-primary-foreground:#fff;--sc-secondary:#fce7f3;
      --sc-secondary-foreground:#9d174d;--sc-accent:#fce7f3;
      --sc-ring:#ec4899;--sc-pink-soft:#fce7f3;--sc-pink-border:#f9a8d4;--sc-pink-ink:#be185d;--sc-radius:8px;
      font-family:Inter,"Segoe UI",Arial,sans-serif!important;color:var(--sc-foreground)!important;
      color-scheme:light;
    }
    *,*::before,*::after{box-sizing:border-box}
    button,input,select,textarea{font-family:inherit!important}
    button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
      outline:2px solid var(--sc-ring)!important;outline-offset:2px!important;box-shadow:none!important
    }
    .app{grid-template-columns:228px minmax(0,1fr)!important;grid-template-rows:48px minmax(0,1fr)!important;background:#fff0f6!important;color:var(--sc-foreground)!important}
    .launch{border-radius:8px!important;box-shadow:none!important;transition:background .15s ease!important}
    .launch:hover{transform:none!important;box-shadow:none!important;filter:none!important}
    .header{grid-column:2!important;grid-row:1!important;height:48px!important;flex-basis:48px!important;justify-content:flex-end!important;padding:0 20px!important;background:#fff0f6!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important}
    .header::before{display:none!important}
    .header-actions{display:flex;align-items:center;gap:8px!important}
    .header-actions::before{display:none!important;content:none!important}
    .close,.menu-btn,.drawer-close{border:1px solid transparent!important;border-radius:var(--sc-radius)!important;background:transparent!important;color:#52525b!important;box-shadow:none!important}
    .close:hover,.menu-btn:hover,.drawer-close:hover{background:var(--sc-muted)!important;color:var(--sc-foreground)!important;transform:none!important}
    .close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important}
    .ops-main{grid-column:2!important;grid-row:2!important;min-width:0;min-height:0;margin:0 8px 8px 0;padding:24px!important;overflow:auto!important;border:1px solid #f1d5e1!important;border-radius:16px!important;background:#fff!important;overscroll-behavior:contain}
    .ops-page{max-width:1500px!important;margin:0 auto!important;padding:0 0 24px!important}
    .page-header{min-height:68px!important;margin:0 0 18px!important;padding:0 0 14px!important;border-bottom:1px solid #f4e2eb!important}
    .page-heading{align-items:center!important;gap:13px!important}
    .page-heading>div:last-child{min-width:0}
    .page-icon{width:34px!important;height:34px!important;flex-basis:34px!important;border:0!important;border-radius:0!important;background:transparent!important;color:#db2777!important;box-shadow:none!important}
    .page-title{color:var(--sc-foreground)!important;font-size:25px!important;font-weight:650!important;line-height:1.2!important;letter-spacing:-.04em!important}
    .page-title::before{display:none!important}
    .page-description{margin-top:5px;color:#71717a;font-size:13px;line-height:1.45}
    .drawer-overlay{position:relative!important;inset:auto!important;grid-column:1!important;grid-row:1/-1!important;z-index:1!important;opacity:1!important;pointer-events:auto!important;background:#fff0f6!important;backdrop-filter:none!important}
    .drawer-panel{position:sticky!important;inset:auto!important;top:0;width:228px!important;height:100vh!important;padding:16px 12px!important;background:#fff0f6!important;border:0!important;box-shadow:none!important;transform:none!important;transition:none!important}
    .drawer-nav{gap:4px!important;margin-top:0!important}
    .nav-item{min-height:38px!important;padding:0 10px!important;border:1px solid transparent!important;border-radius:6px!important;background:transparent!important;color:#52525b!important;font-size:12px!important;font-weight:500!important;box-shadow:none!important;transition:background .15s ease,color .15s ease!important}
    .nav-item:hover{background:var(--sc-muted)!important;color:var(--sc-foreground)!important;transform:none!important}
    .nav-item.active{border-color:transparent!important;border-left:2px solid #db2777!important;background:#fce0ed!important;color:#831843!important;box-shadow:none!important}
    .nav-item.active .nav-icon{color:#be185d!important}
    .nav-icon,.nav-item.active .nav-icon{width:26px!important;height:26px!important;border-radius:5px!important;background:transparent!important;color:inherit!important}
    .card,.delivery-result{border:1px solid #f1e2e9!important;border-radius:8px!important;background:var(--sc-card)!important;box-shadow:none!important;backdrop-filter:none!important;animation:none!important}
    .fms-mobile-card,.pickup-mobile-card,.delivery-mobile-card{border:1px solid var(--sc-border)!important;border-radius:var(--sc-radius)!important;background:#fff!important;box-shadow:none!important;color:var(--sc-foreground)!important}
    .fms-mobile-item,.pickup-mobile-item,.mobile-metric,.pickup-mobile-primary>div,.mobile-detail{border-radius:6px!important;background:#fafafa!important}
    .cardhead,.delivery-result-head,.pickup-result-head{min-height:48px!important;padding:12px 14px!important;border-bottom:1px solid #f4e2eb!important;border-radius:8px 8px 0 0!important;background:#fff!important}
    .cardtitle{color:var(--sc-foreground)!important;font-size:14px!important;font-weight:600!important;letter-spacing:-.01em!important}
    .hint,.small{color:var(--sc-muted-foreground)!important;font-size:12px!important}
    .label{color:#3f3f46!important;font-size:12px!important;font-weight:500!important;letter-spacing:0!important;text-transform:none!important}
    .input,.select,.pick,.pickup-driver-filter{
      min-height:36px!important;height:36px!important;padding:0 10px!important;border:1px solid var(--sc-input)!important;
      border-radius:6px!important;background:#fff!important;color:var(--sc-foreground)!important;font-size:13px!important;
      box-shadow:0 1px 2px rgba(0,0,0,.025)!important;transition:border-color .15s ease,box-shadow .15s ease!important
    }
    .input:hover,.select:hover,.pick:hover,.pickup-driver-filter:hover{border-color:#f0a8c7!important}
    .input:focus,.select:focus,.pick:focus,.pickup-driver-filter:focus{border-color:#f472b6!important;outline:0!important;box-shadow:0 0 0 3px rgba(244,114,182,.18)!important}
    .pick{display:flex!important;align-items:center!important;justify-content:space-between!important;text-align:left!important}
    .primary,.ghostbtn,.pager button,.pickup-pager button{
      min-height:36px!important;height:36px!important;padding:0 14px!important;border-radius:6px!important;
      font-size:13px!important;font-weight:500!important;letter-spacing:0!important;box-shadow:none!important;
      transition:background .15s ease,border-color .15s ease,color .15s ease!important
    }
    .primary{border:1px solid var(--sc-primary)!important;background:var(--sc-primary)!important;color:var(--sc-primary-foreground)!important}
    .primary:hover:not(:disabled){background:#be185d!important;border-color:#be185d!important;transform:none!important;filter:none!important}
    .primary:active:not(:disabled){transform:none!important}
    .ghostbtn{border:1px solid #f3c4d8!important;background:#fff0f6!important;color:#be185d!important}
    .ghostbtn:hover:not(:disabled),.pager button:hover,.pickup-pager button:hover{border-color:#ec8fba!important;background:#fce7f3!important;color:#9d174d!important;transform:none!important}
    button:disabled{opacity:.5!important;cursor:not-allowed!important}
    .query,.delivery-form,.pickup-controls{padding:16px!important;gap:12px!important}
    .tools{padding:12px!important;gap:8px!important;background:#fff!important}
    .meta{background:#fafafa!important;border-color:var(--sc-border)!important;color:var(--sc-muted-foreground)!important}
    .stat-strip,.delivery-kpis{gap:18px!important;padding:14px!important;border-bottom:1px solid #f4e2eb!important;background:#fff!important}
    .stat-card{min-height:66px!important;padding:8px 10px!important;border:0!important;border-left:2px solid #ec4899!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}
    .stat-card:nth-child(n){background:#fff!important}
    .stat-card::before,.stat-card::after{display:none!important;content:none!important}
    .stat-label{color:var(--sc-muted-foreground)!important;font-size:11px!important;font-weight:500!important;letter-spacing:0!important;text-transform:none!important}
    .stat-value{margin-top:7px!important;color:var(--sc-foreground)!important;font-size:22px!important;font-weight:650!important;letter-spacing:-.03em!important}
    .stat-note{color:var(--sc-muted-foreground)!important}
    .tablewrap,.delivery-table-wrap,.pickup-table-wrap{border-top:1px solid var(--sc-border)!important;scrollbar-color:#d4d4d8 transparent!important}
    table,.delivery-table,.pickup-table{border-collapse:collapse!important;border-spacing:0!important}
    th,td{padding:10px 12px!important;border-color:var(--sc-border)!important;line-height:1.45!important}
    th,.delivery-table thead th,.pickup-table thead th{background:#fff!important;color:#806b76!important;font-size:12px!important;font-style:normal!important;font-weight:500!important;letter-spacing:0!important;text-transform:none!important;box-shadow:none!important}
    td{color:#3f3f46!important;font-size:12px!important}
    tbody tr:nth-child(even) td,tbody tr:hover td{background:transparent!important;box-shadow:none!important}
    tbody tr:hover td{background:#fff8fb!important}
    .mono,.pickup-id,.pickup-driver,.pickup-point{color:#18181b!important}
    .badge,.task-chip,.pickup-type,.rank-chip{display:inline-flex!important;align-items:center!important;min-height:22px!important;padding:2px 9px!important;border:1px solid #f3bfd5!important;border-radius:999px!important;background:#fff0f6!important;color:#be185d!important;font-size:11px!important;font-weight:500!important}
    .badge,.task-chip,.rank-chip{border-color:#f9a8d4!important;background:#fce7f3!important;color:#9d174d!important}
    .pickup-type.reverse{border-color:#e9a8d0!important;background:#fce7f3!important;color:#86198f!important}
    .age{border:1px solid var(--sc-border)!important;border-radius:999px!important;background:#fafafa!important;color:#52525b!important}
    .pager,.pickup-pager{min-height:52px!important;border-top:1px solid var(--sc-border)!important;background:#fff!important;color:var(--sc-muted-foreground)!important}
    .delivery-table{min-width:900px!important}
    .delivery-table th,.delivery-table td{border:1px solid var(--sc-border)!important;text-align:center!important}
    .delivery-table thead th{position:sticky!important;top:0!important;z-index:2!important}
    .delivery-table tr.rank-first td{background:#fefce8!important}.delivery-table tr.rank-second td{background:#fafafa!important}
    .delivery-table tr.rank-third td{background:#fff7ed!important}.delivery-table tr.rank-zero td{background:#f0fdf4!important}
    .delivery-table tfoot th{background:#f4f4f5!important;color:#18181b!important;font-weight:600!important}
    .delivery-empty,.pickup-empty{padding:48px 20px!important;border:1px dashed #d4d4d8!important;border-radius:7px!important;background:#fff!important;color:var(--sc-muted-foreground)!important;font-size:13px!important}
    .delivery-empty b{color:var(--sc-foreground)!important;font-size:14px!important}
    .delivery-empty-icon{border:1px solid var(--sc-border)!important;border-radius:8px!important;background:var(--sc-muted)!important;color:#52525b!important}
    .progress,.error{padding:10px 13px!important;border:1px solid var(--sc-border)!important;border-radius:7px!important;box-shadow:none!important;font-size:12px!important;font-weight:500!important;animation:none!important}
    .progress{background:#fff0f6!important;border-color:#f3bfd5!important;color:#9d174d!important}.error{background:#fef2f2!important;border-color:#fecaca!important;color:#991b1b!important}
    .pop{border:1px solid var(--sc-border)!important;border-radius:8px!important;background:#fff!important;box-shadow:0 8px 24px rgba(0,0,0,.10)!important;backdrop-filter:none!important}
    .opt{min-height:34px!important;border-radius:5px!important;color:#27272a!important;font-size:12px!important}
    .opt:hover{background:var(--sc-pink-soft)!important;color:var(--sc-pink-ink)!important;transform:none!important}
    .preview-backdrop{background:rgba(9,9,11,.55)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}
    .preview-modal{border:1px solid var(--sc-border)!important;border-radius:10px!important;background:#fff!important;box-shadow:0 16px 48px rgba(0,0,0,.18)!important}
    .preview-head{border-bottom:1px solid var(--sc-border)!important;background:#fff!important}
    .preview-scroll{background:#f4f4f5!important}
    .seatalk-config{background:#fafafa!important;border-color:var(--sc-border)!important;box-shadow:none!important}
    .seatalk-send{background:var(--sc-secondary)!important;border-color:var(--sc-border)!important;color:var(--sc-secondary-foreground)!important}
    .seatalk-send:hover:not(:disabled){background:#e4e4e7!important;box-shadow:none!important}
    @media(max-width:900px){.app{grid-template-columns:210px minmax(0,1fr)!important}.drawer-panel{width:210px!important}.ops-main{padding:20px!important}.ops-page{padding:0 0 20px!important}.header{padding:0 16px!important}}
    @media(max-width:767px){
      .app{display:flex!important;flex-direction:column!important}
      .header{height:56px!important;flex:0 0 56px!important;justify-content:space-between!important;padding:0 10px!important;background:#fff0f6!important}
      .menu-btn{display:grid!important;width:38px;height:38px}
      .close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important}
      .drawer-overlay{position:fixed!important;inset:0!important;z-index:110!important;background:rgba(157,23,77,.22)!important;opacity:0!important;pointer-events:none!important;transition:opacity .18s ease!important}
      .drawer-overlay.open{opacity:1!important;pointer-events:auto!important}
      .drawer-panel{position:absolute!important;inset:0 auto 0 0!important;width:min(300px,86vw)!important;height:100%!important;padding:16px 12px!important;background:#fff0f6!important;border-right:1px solid #f1d5e1!important;box-shadow:0 12px 32px rgba(190,24,93,.15)!important;transform:translateX(-102%)!important;transition:transform .2s ease!important}
      .drawer-overlay.open .drawer-panel{transform:translateX(0)!important}
      .ops-main{width:100%!important;min-height:0!important;margin:0!important;padding:14px 12px calc(20px + env(safe-area-inset-bottom))!important;border:0!important;border-radius:0!important;background:#fff!important}
      .ops-page{padding:0 0 8px!important}
      .page-header{min-height:64px!important;margin-bottom:14px!important;padding-bottom:12px!important}
      .page-heading{align-items:flex-start!important}.page-title{font-size:21px!important}.page-description{font-size:12px!important}
      .query,.tools,.delivery-form,.pickup-controls{grid-template-columns:1fr!important;padding:12px!important}
      .stat-strip,.delivery-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;padding:10px!important;gap:8px!important}
      .stat-card{min-height:68px!important;padding:10px!important}.stat-value{font-size:19px!important}
      .delivery-result-head,.pickup-result-head{align-items:flex-start!important}
      .tablewrap,.delivery-table-wrap,.pickup-table-wrap{border-radius:0!important}
    }
    @media(max-width:420px){.ops-page{padding-left:10px!important;padding-right:10px!important}.page-title{font-size:19px!important}.page-description{max-width:280px}.stat-card{min-height:64px!important}.stat-value{font-size:18px!important}}
    @media(pointer:coarse){.nav-item,.primary,.ghostbtn,.input,.select,.pick,.pickup-driver-filter{min-height:44px!important}.opt{min-height:40px!important}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
  `;
  shadow.appendChild(shadcnStyle);

  const root = document.createElement("div");
  shadow.appendChild(root);

  // Native SPX menu: render our existing pages to the right of its sidebar.
  const embeddedStyle = document.createElement("style");
  embeddedStyle.id = "spx-native-embedded-style";
  embeddedStyle.textContent = [
    ':host([data-spx-embedded="true"]) .launch{display:none!important}',
    ':host([data-spx-embedded="true"]) .app{position:fixed!important;inset:auto 0 0 var(--spx-ops-left,220px)!important;top:var(--spx-ops-top,0px)!important;width:auto!important;height:auto!important;max-width:none!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:48px minmax(0,1fr)!important;z-index:2147483645!important}',
    ':host([data-spx-embedded="true"]) .drawer-overlay{display:none!important}',
    ':host([data-spx-embedded="true"]) .header{grid-column:1!important;grid-row:1!important;display:flex!important;justify-content:flex-end!important}',
    ':host([data-spx-embedded="true"]) .menu-btn{display:none!important}',
    ':host([data-spx-embedded="true"]) .ops-main{grid-column:1!important;grid-row:2!important;min-height:0!important;min-width:0!important;margin:0!important;border:0!important;border-radius:0!important;overflow:auto!important}',
    '@media(max-width:767px){:host([data-spx-embedded="true"]) .app{inset:0!important;width:100vw!important;height:100vh!important}}'
  ].join("\n");
  shadow.appendChild(embeddedStyle);

  function syncEmbeddedBounds() {
    if (!state.embedded) return;
    const title = document.querySelector("#spx-ops-native-menu > .ssc-menu-submenu-title");
    const rect = title?.getBoundingClientRect();
    const left = rect?.width > 0 && rect.right < window.innerWidth - 200
      ? Math.round(rect.right) : 0;
    let top = 0;
    document.querySelectorAll("header,.ssc-header,.main-header,.app-header").forEach(element => {
      const r = element.getBoundingClientRect();
      if (r.top >= 0 && r.top < 5 && r.bottom <= 140 &&
          r.width >= window.innerWidth * 0.6) top = Math.max(top, Math.round(r.bottom));
    });
    host.style.setProperty("--spx-ops-left", Math.max(0,left) + "px");
    host.style.setProperty("--spx-ops-top", top + "px");
  }

  window.addEventListener("SPX_OPS_OPEN", event => {
    const tab = String(event.detail?.tab || "");
    if (!["fms","delivery","delivery-month","pickup"].includes(tab)) return;
    state.embedded = true;
    state.open = true;
    state.activeTab = tab;
    state.drawerOpen = false;
    state.picker = false;
    host.setAttribute("data-spx-embedded","true");
    syncEmbeddedBounds();
    render();
  });
  window.addEventListener("SPX_OPS_NATIVE_NAV", () => {
    if (!state.embedded) return;
    state.embedded = false;
    state.open = false;
    host.removeAttribute("data-spx-embedded");
    render();
  });
  window.addEventListener("SPX_OPS_MENU_READY", () => {
    if (!state.open) render();
  });
  window.addEventListener("resize", syncEmbeddedBounds);


  function appHeaderHtml() {
    return `<header class="header">
      <button class="menu-btn" data-menu-open aria-label="Mở menu">${icon("menu",21)}</button>
      <div class="header-actions">
        <button class="close" data-close aria-label="Đóng SPX Tools">${icon("close",20)}</button>
      </div>
    </header>`;
  }

  function drawerHtml() {
    return `<div class="drawer-overlay ${state.drawerOpen ? "open" : ""}" data-menu-overlay>
      <aside class="drawer-panel" aria-label="Điều hướng">
        <nav class="drawer-nav">
          <button class="nav-item ${state.activeTab === "fms" ? "active" : ""}" data-nav="fms">
            <span class="nav-icon">${icon("fms",16)}</span><span>FMS Audit</span>
          </button>
          <button class="nav-item ${state.activeTab === "delivery" ? "active" : ""}" data-nav="delivery">
            <span class="nav-icon">${icon("delivery",16)}</span><span>Delivery Performance</span>
          </button>
          <button class="nav-item ${state.activeTab === "delivery-month" ? "active" : ""}" data-nav="delivery-month">
            <span class="nav-icon">${icon("calendar",16)}</span><span>Delivery Performance (Month)</span>
          </button>
          <button class="nav-item ${state.activeTab === "pickup" ? "active" : ""}" data-nav="pickup">
            <span class="nav-icon">${icon("pickup",16)}</span><span>Pickup Assignment</span>
          </button>
        </nav>
      </aside>
    </div>`;
  }

  function pageHeaderHtml(type) {
    const config = type === "pickup"
      ? {icon:"pickup", title:"Pickup Assignment", description:"Theo dõi đơn pickup, tài xế và địa chỉ được phân công."}
      : type === "delivery-month"
        ? {icon:"delivery", title:"Delivery Performance (Month)", description:"Tổng hợp hiệu suất giao hàng theo từng tài xế trong tháng."}
      : type === "delivery"
        ? {icon:"delivery", title:"Delivery Performance", description:"Theo dõi kết quả giao hàng theo ngày và hiệu suất tài xế."}
        : {icon:"fms", title:"FMS Audit", description:"Rà soát hành trình và trạng thái kiện hàng giữa các trạm."};

    return `<header class="page-header">
      <div class="page-heading">
        <div class="page-icon">${icon(config.icon,20)}</div>
        <div><h1 class="page-title">${config.title}</h1><div class="page-description">${config.description}</div></div>
      </div>
    </header>`;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;
  
    for (let i = 0; i < String(text || "").length; i += 1) {
      const ch = text[i];
  
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            value += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          value += ch;
        }
        continue;
      }
  
      if (ch === '"') {
        quoted = true;
        continue;
      }
  
      if (ch === ",") {
        row.push(value);
        value = "";
        continue;
      }
  
      if (ch === "\n") {
        row.push(value.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        value = "";
        continue;
      }
  
      value += ch;
    }
  
    if (value.length || row.length) {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
    }
  
    if (!rows.length) return [];
  
    const headers = rows[0].map((h) => String(h || "").trim());
  
    return rows.slice(1)
      .filter((r) => r.some((cell) => String(cell || "").trim() !== ""))
      .map((r) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = r[index] == null ? "" : r[index];
        });
        return obj;
      });
  }

  function parseMetricNumber(value) {
    const cleaned = String(value == null ? "" : value)
      .replace(/,/g, "")
      .replace(/%/g, "")
      .trim();
  
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
  }

  function buildDeliveryReport(csvText) {
    const raw = parseCsv(csvText);
  
    const ASSIGNED = "Number of Delivery Parcels Assigned (VN) with all Exclusions";
    const DELIVERED = "Number of Parcels Delivered (VN) with all Exclusions";
    const DELAY = "Number of Parcels Onhold (VN) with all Exclusions";
    const RATE = "Delivery Success Rate (VN) with all Exclusions";
  
    const rows = raw.map((item) => {
      const assigned = parseMetricNumber(item[ASSIGNED]);
      const delivered = parseMetricNumber(item[DELIVERED]);
      const delay = parseMetricNumber(item[DELAY]);
  
      let rate = parseMetricNumber(item[RATE]);
      if (!String(item[RATE] || "").trim() && assigned > 0) {
        rate = delivered / assigned * 100;
      }
  
      return {
        driver:String(item.Driver || "").trim(),
        assigned,
        delivered,
        delay,
        rate
      };
    }).filter((item) =>
      item.driver &&
      (
        item.assigned > 0 ||
        item.delivered > 0 ||
        item.delay > 0 ||
        item.rate > 0
      )
    );
  
    rows.sort((a, b) =>
      b.rate - a.rate ||
      b.delivered - a.delivered ||
      b.assigned - a.assigned ||
      a.driver.localeCompare(b.driver)
    );
  
    let previousRate = null;
    let previousRank = 0;
  
    rows.forEach((item, index) => {
      if (previousRate === null || Math.abs(item.rate - previousRate) > 0.000001) {
        previousRank = index + 1;
        previousRate = item.rate;
      }
      item.rank = previousRank;
    });
  
    const totals = rows.reduce((acc, item) => {
      acc.assigned += item.assigned;
      acc.delivered += item.delivered;
      acc.delay += item.delay;
      return acc;
    }, {assigned:0, delivered:0, delay:0});
  
    totals.rate = totals.assigned > 0
      ? totals.delivered / totals.assigned * 100
      : 0;
  
    return {rows, totals};
  }

  function formatVietnameseReportDate(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return value || "";
    return "Ngày " + parts[2] + " Tháng " + parts[1] + " Năm " + parts[0];
  }

  function formatVietnameseReportMonth(value) {
    const parts = String(value || "").split("-");
    return parts.length === 2 ? "Tháng " + parts[1] + " Năm " + parts[0] : value || "";
  }

  function buildMonthlyDeliveryReport(csvText) {
    const raw = parseCsv(csvText);
    const rows = raw.map((item) => ({
      driver:String(item.Driver || "").trim(),
      workingDays:parseMetricNumber(item["Number of days working"]),
      assigned:parseMetricNumber(item["Number of parcels assigned (VN)"]),
      rateAssigned:parseMetricNumber(item["Number of Delivery Parcels Assigned (VN) with all Exclusions"]),
      delivered:parseMetricNumber(item["Number of Parcels Delivered (VN) with all Exclusions"]),
      rate:parseMetricNumber(item["Delivery Success Rate (VN) with all Exclusions"])
    })).filter((item) => item.driver && (
      item.workingDays > 0 || item.assigned > 0 || item.delivered > 0 || item.rate > 0
    ));

    rows.sort((a,b) =>
      b.rate - a.rate || b.delivered - a.delivered ||
      b.assigned - a.assigned || a.driver.localeCompare(b.driver)
    );

    const totals = rows.reduce((acc, item) => {
      acc.workingDays += item.workingDays;
      acc.assigned += item.assigned;
      acc.rateAssigned += item.rateAssigned || item.assigned;
      acc.delivered += item.delivered;
      return acc;
    }, {workingDays:0, assigned:0, rateAssigned:0, delivered:0, rate:0});
    totals.rate = totals.rateAssigned > 0 ? totals.delivered / totals.rateAssigned * 100 : 0;
    return {rows, totals};
  }

  function requestDeliveryExport() {
    if (state.delivery.loading) return;
  
    const date = String(state.delivery.startDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      state.delivery.error = "Vui lòng chọn ngày hợp lệ.";
      render();
      return;
    }
  
    state.delivery.loading = true;
    state.delivery.error = "";
    state.delivery.progress = "Đang tạo export task...";
    state.delivery.requestId =
      Date.now() + "_delivery_" + Math.random().toString(36).slice(2);
    state.delivery.taskId = 0;
    state.delivery.stationName = "";
    state.delivery.fileName = "";
    state.delivery.csvText = "";
    state.delivery.rows = [];
    state.delivery.totals = null;
    state.delivery.previewDataUrl = "";
    state.delivery.previewOpen = false;
  
    render();
  
    post("SPX_DELIVERY_EXPORT_RUN", {
      requestId:state.delivery.requestId,
      startDate:date
    });
  }

  function cancelDeliveryExport() {
    if (!state.delivery.loading) return;
    post("SPX_DELIVERY_EXPORT_CANCEL", {
      requestId:state.delivery.requestId
    });
  }

  function requestDeliveryMonthExport() {
    const d = state.deliveryMonth;
    if (d.loading) return;
    const month = String(d.startMonth || "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      d.error = "Vui lòng chọn tháng hợp lệ.";
      render();
      return;
    }

    d.loading = true;
    d.error = "";
    d.progress = "Đang tạo export task theo tháng...";
    d.requestId = Date.now() + "_delivery_month_" + Math.random().toString(36).slice(2);
    d.taskId = 0;
    d.fileName = "";
    d.rows = [];
    d.totals = null;
    render();
    post("SPX_DELIVERY_MONTH_EXPORT_RUN", {requestId:d.requestId, startDate:month});
  }

  function cancelDeliveryMonthExport() {
    const d = state.deliveryMonth;
    if (!d.loading) return;
    post("SPX_DELIVERY_MONTH_EXPORT_CANCEL", {requestId:d.requestId});
  }

  function deliveryTableHtml() {
    const d = state.delivery;
  
    if (!d.rows.length) {
      return `<div class="delivery-empty">
        <div class="delivery-empty-icon">${icon("download",24)}</div>
        <b>Chưa có Delivery Performance</b>
        <div>Chọn ngày rồi nhấn <strong>Export & xử lý báo cáo</strong>.</div>
      </div>`;
    }
  
    const body = d.rows.map((row, index) => {
      const cls =
        row.rank === 1 ? "rank-first" :
        row.rank === 2 ? "rank-second" :
        row.rank === 3 ? "rank-third" :
        row.assigned === 0 ? "rank-zero" : "";
  
      return `<tr class="${cls}">
        <td class="driver">${esc(row.driver)}</td>
        <td>${row.assigned.toLocaleString("en-US")}</td>
        <td>${row.delivered.toLocaleString("en-US")}</td>
        <td>${row.delay.toLocaleString("en-US")}</td>
        <td><b>${row.rate.toFixed(1)}%</b></td>
        <td><b>${row.rank}</b></td>
      </tr>`;
    }).join("");

    const mobileCards = d.rows.map((row) => {
      const rankClass =
        row.rank === 1 ? "rank-first" :
        row.rank === 2 ? "rank-second" :
        row.rank === 3 ? "rank-third" :
        row.assigned === 0 ? "rank-zero" : "";
      return `<article class="delivery-mobile-card ${rankClass}">
        <div class="mobile-card-head">
          <div class="mobile-card-title">${esc(row.driver)}</div>
          <span class="rank-chip">#${row.rank}</span>
        </div>
        <div class="mobile-metric-grid">
          <div class="mobile-metric"><span>Đơn nhận</span><b>${row.assigned.toLocaleString("en-US")}</b></div>
          <div class="mobile-metric"><span>Giao TC</span><b>${row.delivered.toLocaleString("en-US")}</b></div>
          <div class="mobile-metric"><span>Delay</span><b>${row.delay.toLocaleString("en-US")}</b></div>
          <div class="mobile-metric"><span>Tỷ lệ GTC</span><b>${row.rate.toFixed(1)}%</b></div>
        </div>
      </article>`;
    }).join("");
  
    const t = d.totals || {assigned:0,delivered:0,delay:0,rate:0};
  
    return `<section class="delivery-result">
      <div class="delivery-kpis">
        <div class="stat-card stat-orange"><div class="stat-label">Drivers</div><div class="stat-value">${d.rows.length.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-purple"><div class="stat-label">Đơn Nhận</div><div class="stat-value">${t.assigned.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-green"><div class="stat-label">Giao Thành Công</div><div class="stat-value">${t.delivered.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-amber"><div class="stat-label">Delay</div><div class="stat-value">${t.delay.toLocaleString("en-US")}</div></div>
      </div>
      <div class="delivery-result-head">
        <div>
          <div class="cardtitle">Delivery Performance Report</div>
          <div class="hint">${esc(formatVietnameseReportDate(d.startDate))}</div>
        </div>
        <div class="delivery-actions">
          <button class="ghostbtn" data-delivery-preview>${icon("image",16)}<span>Preview JPG</span></button>
          <button class="ghostbtn" data-delivery-download-jpg>${icon("download",16)}<span>Tải JPG</span></button>
        </div>
      </div>
      <div class="delivery-mobile-list">${mobileCards}</div>
      <div class="delivery-table-wrap">
        <table class="delivery-table">
          <thead><tr>
            <th>Driver</th>
            <th>Đơn Nhận</th>
            <th>Đơn Giao TC</th>
            <th>Delay</th>
            <th>Tỷ Lệ GTC</th>
            <th>Xếp Hạng</th>
          </tr></thead>
          <tbody>${body}</tbody>
          <tfoot><tr>
            <th>Total :</th>
            <th>${t.assigned.toLocaleString("en-US")}</th>
            <th>${t.delivered.toLocaleString("en-US")}</th>
            <th>${t.delay.toLocaleString("en-US")}</th>
            <th>${t.rate.toFixed(2)}%</th>
            <th></th>
          </tr></tfoot>
        </table>
      </div>
    </section>`;
  }

  function renderDeliveryTab() {
    const d = state.delivery;
  
    return `<section class="delivery-layout">
      <section class="card delivery-control">
        <div class="cardhead">
          <div>
            <div class="cardtitle">Delivery Performance</div>
          </div>
          ${d.taskId ? `<span class="task-chip">Task #${d.taskId}</span>` : ""}
        </div>
  
        <div class="delivery-form">
          <div class="field">
            <label class="label">Start Date</label>
            <input class="input" type="date" data-delivery-date value="${esc(d.startDate)}" ${d.loading ? "disabled" : ""}>
          </div>
  
          <div></div>
  
          <div class="delivery-form-actions">
            ${d.loading ? `<button class="ghostbtn" data-delivery-cancel>Hủy</button>` : ""}
            <button class="primary delivery-run" data-delivery-run ${d.loading || !state.bridgeReady ? "disabled" : ""}>
              ${d.loading ? "Đang xử lý..." : icon("download",16) + "<span>Export & xử lý báo cáo</span>"}
            </button>
          </div>
        </div>
      </section>
  
      ${d.progress ? `<div class="progress">${esc(d.progress)}</div>` : ""}
      ${d.error ? `<div class="error">${esc(d.error)}</div>` : ""}
  
      ${deliveryTableHtml()}
    </section>`;
  }

  function deliveryMonthTableHtml() {
    const d = state.deliveryMonth;
    if (!d.rows.length) {
      return `<div class="delivery-empty">
        <div class="delivery-empty-icon">${icon("calendar",24)}</div>
        <b>Chưa có Delivery Performance tháng</b>
        <div>Chọn tháng rồi nhấn <strong>Export & xử lý báo cáo</strong>.</div>
      </div>`;
    }

    const rows = d.rows.map((row) => `<tr>
      <td class="driver">${esc(row.driver)}</td>
      <td>${row.workingDays.toLocaleString("en-US")}</td>
      <td>${row.assigned.toLocaleString("en-US")}</td>
      <td>${row.delivered.toLocaleString("en-US")}</td>
      <td><b>${row.rate.toFixed(2)}%</b></td>
    </tr>`).join("");
    const mobileCards = d.rows.map((row) => `<article class="delivery-mobile-card">
      <div class="mobile-card-head"><div class="mobile-card-title">${esc(row.driver)}</div></div>
      <div class="mobile-metric-grid">
        <div class="mobile-metric"><span>Number of days working</span><b>${row.workingDays.toLocaleString("en-US")}</b></div>
        <div class="mobile-metric"><span>Number of parcels assigned (VN)</span><b>${row.assigned.toLocaleString("en-US")}</b></div>
        <div class="mobile-metric"><span>Parcels delivered</span><b>${row.delivered.toLocaleString("en-US")}</b></div>
        <div class="mobile-metric"><span>Delivery Success Rate</span><b>${row.rate.toFixed(2)}%</b></div>
      </div>
    </article>`).join("");
    const totals = d.totals || {workingDays:0, assigned:0, delivered:0, rate:0};

    return `<section class="delivery-result">
      <div class="delivery-kpis">
        <div class="stat-card"><div class="stat-label">Drivers</div><div class="stat-value">${d.rows.length.toLocaleString("en-US")}</div></div>
        <div class="stat-card"><div class="stat-label">Working Days</div><div class="stat-value">${totals.workingDays.toLocaleString("en-US")}</div></div>
        <div class="stat-card"><div class="stat-label">Parcels Assigned</div><div class="stat-value">${totals.assigned.toLocaleString("en-US")}</div></div>
        <div class="stat-card"><div class="stat-label">Parcels Delivered</div><div class="stat-value">${totals.delivered.toLocaleString("en-US")}</div></div>
      </div>
      <div class="delivery-result-head">
        <div><div class="cardtitle">Delivery Performance Monthly Report</div><div class="hint">${esc(formatVietnameseReportMonth(d.startMonth))}</div></div>
        ${d.taskId ? `<span class="task-chip">Task #${d.taskId}</span>` : ""}
      </div>
      <div class="delivery-mobile-list">${mobileCards}</div>
      <div class="delivery-table-wrap">
        <table class="delivery-table">
          <thead><tr>
            <th>Driver</th>
            <th>Number of days working</th>
            <th>Number of parcels assigned (VN)</th>
            <th>Number of Parcels Delivered (VN) with all Exclusions</th>
            <th>Delivery Success Rate (VN) with all Exclusions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <th>Total</th>
            <th>${totals.workingDays.toLocaleString("en-US")}</th>
            <th>${totals.assigned.toLocaleString("en-US")}</th>
            <th>${totals.delivered.toLocaleString("en-US")}</th>
            <th>${totals.rate.toFixed(2)}%</th>
          </tr></tfoot>
        </table>
      </div>
    </section>`;
  }

  function renderDeliveryMonthTab() {
    const d = state.deliveryMonth;
    return `<section class="delivery-layout">
      <section class="card delivery-control">
        <div class="cardhead">
          <div class="cardtitle">Delivery Performance (Month)</div>
          ${d.taskId ? `<span class="task-chip">Task #${d.taskId}</span>` : ""}
        </div>
        <div class="delivery-form">
          <div class="field">
            <label class="label">Tháng báo cáo</label>
            <input class="input" type="month" data-delivery-month value="${esc(d.startMonth)}" ${d.loading ? "disabled" : ""}>
          </div>
          <div></div>
          <div class="delivery-form-actions">
            ${d.loading ? `<button class="ghostbtn" data-delivery-month-cancel>Hủy</button>` : ""}
            <button class="primary delivery-run" data-delivery-month-run ${d.loading || !state.bridgeReady ? "disabled" : ""}>
              ${d.loading ? "Đang xử lý..." : icon("download",16) + "<span>Export & xử lý báo cáo</span>"}
            </button>
          </div>
        </div>
      </section>
      ${d.progress ? `<div class="progress">${esc(d.progress)}</div>` : ""}
      ${d.error ? `<div class="error">${esc(d.error)}</div>` : ""}
      ${deliveryMonthTableHtml()}
    </section>`;
  }

  function createDeliveryJpegPreview() {
    const d = state.delivery;
    if (!d.rows.length || !d.totals) return "";
  
    const width = 1400;
    const titleH = 58;
    const dateH = 46;
    const headerH = 46;
    const rowH = 42;
    const totalH = 46;
    const height = titleH + dateH + headerH + d.rows.length * rowH + totalH;
  
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "middle";
  
    const cols = [0, 520, 710, 900, 1060, 1240, 1400];
  
    function cell(x1, x2, y, h, fill, text, align, bold, size) {
      ctx.fillStyle = fill;
      ctx.fillRect(x1, y, x2 - x1, h);
      ctx.strokeStyle = "#8a9aa0";
      ctx.lineWidth = 1;
      ctx.strokeRect(x1 + .5, y + .5, x2 - x1 - 1, h - 1);
  
      ctx.fillStyle = "#111827";
      ctx.font = (bold ? "700 " : "500 ") + (size || 22) + 'px "Be Vietnam Pro", Arial';
      ctx.textAlign = align || "center";
  
      const pad = 14;
      const x =
        align === "left" ? x1 + pad :
        align === "right" ? x2 - pad :
        (x1 + x2) / 2;
  
      ctx.fillText(String(text), x, y + h / 2);
    }
  
    cell(0, 700, 0, titleH, "#e7f5f8",
      "DELIVERY " + String(d.stationName || "PLEIKU 03 HUB").toUpperCase(),
      "center", true, 25);
  
    cell(700, 1400, 0, titleH, "#e7f5f8",
      formatVietnameseReportDate(d.startDate),
      "center", true, 23);
  
    const headers = ["Driver","Đơn Nhận","Đơn Giao TC","Delay","Tỷ Lệ GTC","Xếp Hạng"];
    for (let i = 0; i < 6; i += 1) {
      cell(cols[i], cols[i+1], titleH, dateH + headerH, "#18a957",
        headers[i], i === 0 ? "center" : "center", true, 21);
    }
  
    let y = titleH + dateH + headerH;
  
    d.rows.forEach((row, index) => {
      let fill = index % 2 ? "#ffffff" : "#f8fafc";
      if (row.rank === 1) fill = "#fff200";
      else if (row.rank === 2) fill = "#fff3dc";
      else if (row.rank === 3) fill = "#f8ded3";
      else if (row.assigned === 0) fill = "#effbea";
  
      const values = [
        row.driver,
        row.assigned,
        row.delivered,
        row.delay,
        row.rate.toFixed(1) + "%",
        row.rank
      ];
  
      for (let i = 0; i < 6; i += 1) {
        cell(cols[i], cols[i+1], y, rowH, fill, values[i],
          i === 0 ? "left" : "center", row.rank <= 3, 20);
      }
      y += rowH;
    });
  
    const t = d.totals;
    const totalValues = [
      "Total :",
      t.assigned,
      t.delivered,
      t.delay,
      t.rate.toFixed(2) + "%",
      ""
    ];
  
    for (let i = 0; i < 6; i += 1) {
      cell(cols[i], cols[i+1], y, totalH, "#dff4fa",
        totalValues[i], i === 0 ? "right" : "center", true, 22);
    }
  
    return canvas.toDataURL("image/jpeg", .95);
  }

  function renderDeliveryPreviewModal() {
    const d = state.delivery;
    if (!d.previewOpen || !d.previewDataUrl) return "";
  
    return `<div class="preview-backdrop" data-preview-close>
      <div class="preview-modal" data-preview-panel>
        <div class="preview-head">
          <div>
            <b>Preview Delivery Performance JPG</b>
            <div class="hint">${esc(d.stationName)} · ${esc(d.startDate)}</div>
          </div>
          <button class="close" data-preview-close>${icon("close",20)}</button>
        </div>
        <div class="preview-scroll">
          <img src="${d.previewDataUrl}" alt="Delivery Performance Preview">
        </div>
      </div>
    </div>`;
  }

  function pickerHtml() {
    if (!state.picker) return "";

    const keyword = state.statusSearch.trim().toLowerCase();
    const visibleStatuses = STATUSES.filter(x => {
      if (!keyword) return true;
      return String(x.code).toLowerCase().includes(keyword) ||
        String(x.name || "").toLowerCase().includes(keyword);
    });

    return `<div class="pop">
      <div class="status-search-wrap">
        <input class="input status-search" data-status-search type="search" autocomplete="off" placeholder="Tìm trạng thái..." value="${esc(state.statusSearch)}">
      </div>
      <label class="opt"><input type="checkbox" data-all ${state.selectedStatuses.length===0?"checked":""}><span>Tất cả trạng thái</span></label>
      ${visibleStatuses.map(x => `<label class="opt"><input type="checkbox" data-status="${esc(x.code)}" ${state.selectedStatuses.includes(String(x.code))?"checked":""}><span>${esc(x.name)}</span></label>`).join("")}
      ${visibleStatuses.length ? "" : `<div class="empty" style="padding:24px 12px">Không tìm thấy trạng thái.</div>`}
    </div>`;
  }

  function tableHtml() {
    if (!state.rows.length) return `<div class="empty"><b>Chưa có dữ liệu FMS</b><br>Chọn điều kiện rồi nhấn Tải dữ liệu.</div>`;
    const rows = filteredRows();
    const pages = Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    state.page = Math.min(Math.max(1,state.page),pages);
    const start = (state.page-1)*PAGE_SIZE;
    const view = rows.slice(start,start+PAGE_SIZE);
    const mobileCards = view.map(row => `
      <article class="fms-mobile-card">
        <div class="fms-mobile-top">
          <div>
            <div class="fms-mobile-spx">${esc(row.shipmentId)}</div>
            <div class="fms-mobile-to">${esc(row.to || "Không có TO")}</div>
          </div>
          <span class="age">${esc(aging(row.latest?.timestamp))}</span>
        </div>
        <div class="fms-mobile-grid">
          <div class="fms-mobile-item"><div class="fms-mobile-label">Order Status</div><div class="fms-mobile-value">${esc(statusName(row.orderStatus))}</div></div>
          <div class="fms-mobile-item"><div class="fms-mobile-label">Đã qua</div><div class="fms-mobile-value">${esc(elapsed(row.latest?.timestamp))}</div></div>
          <div class="fms-mobile-item"><div class="fms-mobile-label">Current Station</div><div class="fms-mobile-value">${esc(row.current || "—")}</div></div>
          <div class="fms-mobile-item"><div class="fms-mobile-label">Next Station</div><div class="fms-mobile-value">${esc(row.next || "—")}</div></div>
          <div class="fms-mobile-item"><div class="fms-mobile-label">Tracking cuối</div><div class="fms-mobile-value">${esc(row.latest?.message || "—")}</div></div>
          <div class="fms-mobile-item"><div class="fms-mobile-label">Cập nhật</div><div class="fms-mobile-value">${esc(dateTime(row.latest?.timestamp))}</div></div>
        </div>
      </article>
    `).join("");
    const agingUnder24 = rows.filter(row => aging(row.latest?.timestamp) === "< 24H").length;
    const aging24to36 = rows.filter(row => aging(row.latest?.timestamp) === "24H → 36H").length;
    const agingOver36 = rows.filter(row => aging(row.latest?.timestamp) === "> 36H").length;

    return `<section class="card">
      <div class="stat-strip">
        <div class="stat-card stat-orange"><div class="stat-label">Kết quả</div><div class="stat-value">${rows.length}</div></div>
        <div class="stat-card stat-green"><div class="stat-label">&lt; 24H</div><div class="stat-value">${agingUnder24}</div></div>
        <div class="stat-card stat-amber"><div class="stat-label">24H → 36H</div><div class="stat-value">${aging24to36}</div></div>
        <div class="stat-card stat-purple"><div class="stat-label">&gt; 36H</div><div class="stat-value">${agingOver36}</div></div>
      </div>
      <div class="cardhead"><div class="cardtitle">Kết quả</div><b>${rows.length}</b></div>
      <div class="tools">
        <input class="input" data-search placeholder="Tìm SPX, TO, Order Status, Station..." value="${esc(state.search)}">
        <select class="select" data-aging>
          <option value="ALL">Tất cả Aging</option>
          <option value="< 24H" ${state.aging==="< 24H"?"selected":""}>&lt; 24H</option>
          <option value="24H → 36H" ${state.aging==="24H → 36H"?"selected":""}>24H → 36H</option>
          <option value="> 36H" ${state.aging==="> 36H"?"selected":""}>&gt; 36H</option>
        </select>
        <select class="select" data-order-status>
          <option value="ALL">Tất cả Order Status đã tải</option>
          ${resultStatuses().map(c=>`<option value="${esc(c)}" ${state.orderStatus===c?"selected":""}>${esc(statusName(c))}</option>`).join("")}
        </select>
      </div>
      <div class="meta"><span>${esc(state.applied?.current||"")} → ${esc(state.applied?.next||"")}</span><span>${state.applied?.statuses?.length||"Tất cả"} Order Status</span></div>
      <div class="fms-mobile-list">${mobileCards}</div>
      <div class="tablewrap"><table><thead><tr><th>SPX Tracking Number</th><th>TO Number</th><th>Order Status</th><th>Current Station</th><th>Next Station</th><th>Tracking cuối</th><th>Cập nhật cuối</th><th>Đã qua</th><th>Aging</th></tr></thead>
      <tbody>${view.map(row=>`<tr>
        <td class="mono">${esc(row.shipmentId)}</td><td class="mono">${esc(row.to||"—")}</td>
        <td><span class="badge">${esc(statusName(row.orderStatus))}</span></td>
        <td>${esc(row.current||"—")}</td><td>${esc(row.next||"—")}</td>
        <td>${esc(row.latest?.message||"—")}</td>
        <td>${esc(dateTime(row.latest?.timestamp))}</td><td><b>${esc(elapsed(row.latest?.timestamp))}</b></td><td><span class="age">${esc(aging(row.latest?.timestamp))}</span></td>
      </tr>`).join("")}</tbody></table></div>
      <div class="pager"><span>${rows.length?start+1:0}-${Math.min(start+PAGE_SIZE,rows.length)} / ${rows.length}</span><span><button data-prev>${icon("chevronLeft",14)}<span>Trước</span></button> &nbsp; Trang ${state.page}/${pages} &nbsp; <button data-next><span>Sau</span>${icon("chevronRight",14)}</button></span></div>
    </section>`;
  }


  function pickupTypeName(type) {
    return Number(type) === 5 ? "Reverse" : "Pickup";
  }

  function normalizePickupRows(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      shipmentId:String(row?.pickup_order_id || ""),
      eta:Number(row?.eta || 0),
      attempts:Number(row?.pickup_attempts || 0),
      pickupOrderType:Number(row?.pickup_order_type || 0),
      pointName:String(row?.pickup_point_name || ""),
      stationName:String(row?.pickup_station_name || ""),
      serviceName:String(row?.fo_service_type_name || ""),
      address:String(row?.address || ""),
      driverName:String(row?.driver_name || ""),
      driverCtime:Number(row?.driver_ctime || 0),
      driverRemark:String(row?.driver_remark || ""),
      driverStatus:String(row?.driver_status || ""),
      reason:String(row?.driver_reason || row?.on_hold_reason_name || ""),
      addressError:String(row?.address_error || ""),
      driverError:String(row?.driver_error || "")
    })).filter((row) => row.shipmentId);
  }

  function loadPickupAddressCache() {
    return new Promise((resolve) => {
      const storage = globalThis.chrome?.storage?.local;
      if (!storage?.get) {
        resolve({});
        return;
      }

      storage.get([PICKUP_ADDRESS_CACHE_KEY], (result) => {
        const stored = result?.[PICKUP_ADDRESS_CACHE_KEY];
        const now = Date.now();
        const cache = {};
        for (const [shipmentId, entry] of Object.entries(stored && typeof stored === "object" ? stored : {})) {
          const address = String(entry?.address || "").trim();
          const savedAt = Number(entry?.savedAt || 0);
          if (!shipmentId || !address || !savedAt || savedAt > now || now - savedAt >= PICKUP_ADDRESS_CACHE_TTL) continue;
          cache[shipmentId] = {address, savedAt};
        }

        storage.set?.({[PICKUP_ADDRESS_CACHE_KEY]:cache}, () => resolve(cache));
        if (!storage.set) resolve(cache);
      });
    });
  }

  function persistPickupAddressCache(rows, previousCache) {
    const now = Date.now();
    const validRows = Array.isArray(rows) ? rows : [];
    const cache = {};
    for (const row of validRows) {
      const shipmentId = String(row?.pickup_order_id || "").trim();
      if (!shipmentId) continue;
      const previous = previousCache?.[shipmentId];
      const address = String(row?.address || previous?.address || "").trim();
      if (!address) continue;
      const savedAt = previous && previous.address === address
        ? Number(previous.savedAt || now)
        : now;
      cache[shipmentId] = {address, savedAt};
    }

    return new Promise((resolve) => {
      const storage = globalThis.chrome?.storage?.local;
      if (!storage?.set) {
        resolve(validRows.map((row) => ({
          ...row,
          address:String(row?.address || previousCache?.[String(row?.pickup_order_id || "")]?.address || "")
        })));
        return;
      }

      storage.set({[PICKUP_ADDRESS_CACHE_KEY]:cache}, () => {
        resolve(validRows.map((row) => ({
          ...row,
          address:String(row?.address || cache[String(row?.pickup_order_id || "")]?.address || "")
        })));
      });
    });
  }

  function pickupDriverOptions() {
    return [...new Set(
      state.pickup.rows
        .map((row) => String(row.driverName || "").trim())
        .filter(Boolean)
    )].sort((a,b) => a.localeCompare(b, "vi"));
  }

  function pickupFilteredRows() {
    const driver = String(state.pickup.driverFilter || "ALL");
    return state.pickup.rows.filter((row) =>
      driver === "ALL" || row.driverName === driver
    ).sort((a, b) =>
      Number(a.eta || 0) - Number(b.eta || 0) ||
      a.shipmentId.localeCompare(b.shipmentId)
    );
  }

  function resetPickupFilter() {
    state.pickup.driverFilter = "ALL";
    state.pickup.page = 1;
  }

  function requestPickupAssignment() {
    const p = state.pickup;
    if (p.loading) return;

    p.loading = true;
    p.error = "";
    p.progress = "Đang tải danh sách Pickup Assignment...";
    p.requestId = Date.now() + "_pickup_" + Math.random().toString(36).slice(2);
    p.rows = [];
    p.total = 0;
    p.page = 1;
    p.addressCache = {};
    resetPickupFilter();
    render();

    const requestId = p.requestId;
    loadPickupAddressCache().then((cache) => {
      if (!p.loading || p.requestId !== requestId) return;
      p.addressCache = cache;
      const addressCache = Object.fromEntries(
        Object.entries(cache).map(([shipmentId, entry]) => [shipmentId, entry.address])
      );
      post("SPX_PICKUP_ASSIGNMENT_FETCH", {
        requestId,
        range:{
          startDate:p.startDate,
          endDate:p.endDate
        },
        addressCache
      });
    });
  }

  function cancelPickupAssignment() {
    if (!state.pickup.loading) return;
    post("SPX_PICKUP_ASSIGNMENT_CANCEL", {
      requestId:state.pickup.requestId
    });
  }

  function pickupTableHtml() {
    const p = state.pickup;
    const rows = pickupFilteredRows();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    p.page = Math.min(Math.max(1, p.page), pages);
    const start = (p.page - 1) * PAGE_SIZE;
    const view = rows.slice(start, start + PAGE_SIZE);
    const reverseCount = p.rows.filter((row) => Number(row.pickupOrderType) === 5).length;
    const withDriver = p.rows.filter((row) => row.driverName).length;
    const driverOptions = pickupDriverOptions();

    const body = view.map((row) => {
      const typeClass = Number(row.pickupOrderType) === 5 ? "pickup-type reverse" : "pickup-type";
      return `<tr>
        <td class="pickup-id">${esc(row.shipmentId)}</td>
        <td class="pickup-driver">${esc(row.driverName || "Chưa có")}</td>
        <td class="pickup-attempt">${row.attempts}</td>
        <td class="pickup-address">${esc(row.address || "—")}</td>
        <td class="pickup-eta">${esc(dateTime(row.eta))}</td>
        <td><span class="${typeClass}">${esc(pickupTypeName(row.pickupOrderType))}</span></td>
        <td class="pickup-point">${esc(row.pointName || "—")}</td>
        <td><b>${esc(dateTime(row.driverCtime))}</b>${row.driverRemark ? `<div class="pickup-sub">${esc(row.driverRemark)}</div>` : ""}</td>
        <td class="pickup-reason">${esc(row.reason || "—")}</td>
      </tr>`;
    }).join("");

    const mobileCards = view.map((row) => {
      const typeClass = Number(row.pickupOrderType) === 5 ? "pickup-type reverse" : "pickup-type";
      return `<article class="pickup-mobile-card">
        <div class="mobile-card-head">
          <div>
            <div class="mobile-card-title pickup-id">${esc(row.shipmentId)}</div>
            <div class="mobile-card-sub">${esc(row.driverName || "Chưa có tài xế")}</div>
          </div>
          <span class="${typeClass}">${esc(pickupTypeName(row.pickupOrderType))}</span>
        </div>
        <div class="pickup-mobile-primary">
          <div><span>Attempt</span><b>${row.attempts}</b></div>
          <div><span>ETA</span><b>${esc(dateTime(row.eta))}</b></div>
        </div>
        <div class="mobile-detail"><span>Địa chỉ</span><b>${esc(row.address || "—")}</b></div>
        <div class="mobile-detail"><span>Điểm pickup</span><b>${esc(row.pointName || "—")}</b></div>
        <div class="pickup-mobile-meta">
          <span>${esc(dateTime(row.driverCtime))}</span>
          <span>${esc(row.reason || row.driverRemark || "—")}</span>
        </div>
      </article>`;
    }).join("");

    return `<section class="card pickup-result">
      <div class="stat-strip">
        <div class="stat-card stat-orange"><div class="stat-label">Assigned</div><div class="stat-value">${p.total.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-green"><div class="stat-label">Hiển thị</div><div class="stat-value">${rows.length.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-purple"><div class="stat-label">Có tài xế</div><div class="stat-value">${withDriver.toLocaleString("en-US")}</div></div>
        <div class="stat-card stat-amber"><div class="stat-label">Reverse</div><div class="stat-value">${reverseCount.toLocaleString("en-US")}</div></div>
      </div>
      <div class="pickup-result-head">
        <div class="cardtitle">Danh sách</div>
        <select class="pickup-driver-filter" data-pickup-driver-filter>
          <option value="ALL">Tất cả tài xế</option>
          ${driverOptions.map((name) => `<option value="${esc(name)}" ${p.driverFilter === name ? "selected" : ""}>${esc(name)}</option>`).join("")}
        </select>
      </div>
      ${p.rows.length ? `<div class="pickup-mobile-list">${mobileCards}</div>
      <div class="pickup-table-wrap">
        <table class="pickup-table">
          <colgroup>
            <col style="width:165px">
            <col style="width:155px">
            <col style="width:74px">
            <col style="width:300px">
            <col style="width:155px">
            <col style="width:90px">
            <col style="width:150px">
            <col style="width:165px">
            <col style="width:210px">
          </colgroup>
          <thead><tr>
            <th>Mã đơn</th><th>Tài xế</th><th>Attempt</th><th>Địa chỉ</th><th>ETA</th><th>Loại</th><th>Điểm pickup</th><th>Cập nhật gần nhất</th><th>Trạng thái / lý do</th>
          </tr></thead>
          <tbody>${body || `<tr><td colspan="9"><div class="pickup-empty">Không có dữ liệu.</div></td></tr>`}</tbody>
        </table>
      </div>
      <div class="pickup-pager">
        <span>${rows.length ? start + 1 : 0}-${Math.min(start + PAGE_SIZE, rows.length)} / ${rows.length}</span>
        <span>
          <button data-pickup-prev ${p.page <= 1 ? "disabled" : ""}>${icon("chevronLeft",14)}<span>Trước</span></button>
          <b>${p.page}/${pages}</b>
          <button data-pickup-next ${p.page >= pages ? "disabled" : ""}><span>Sau</span>${icon("chevronRight",14)}</button>
        </span>
      </div>` : `<div class="pickup-empty">Chưa có dữ liệu.</div>`}
    </section>`;
  }

  function renderPickupTab() {
    const p = state.pickup;
    return `<section class="pickup-layout">
      <section class="card">
        <div class="cardhead">
          <div class="cardtitle">Khoảng thời gian</div>
          ${p.total ? `<b>${p.total.toLocaleString("en-US")} đơn</b>` : ""}
        </div>
        <div class="pickup-controls">
          <div class="field"><label class="label">Từ ngày</label><input class="input" type="date" data-pickup-start-date value="${esc(p.startDate)}" ${p.loading ? "disabled" : ""}></div>
          <div class="field"><label class="label">Đến ngày</label><input class="input" type="date" data-pickup-end-date value="${esc(p.endDate)}" ${p.loading ? "disabled" : ""}></div>
          <div></div>
          <div class="pickup-actions">
            ${p.loading ? `<button class="ghostbtn" data-pickup-cancel>Hủy</button>` : ""}
            <button class="primary" data-pickup-load ${p.loading || !state.bridgeReady ? "disabled" : ""}>${p.loading ? "Đang xử lý..." : icon("refresh",16) + "<span>Tải dữ liệu</span>"}</button>
          </div>
        </div>
      </section>
      ${p.progress ? `<div class="progress">${esc(p.progress)}</div>` : ""}
      ${p.error ? `<div class="error">${esc(p.error)}</div>` : ""}
      ${pickupTableHtml()}
    </section>`;
  }

  function render() {
    if (!state.open) {
      if (document.getElementById("spx-ops-native-menu")) { root.innerHTML = ""; return; }
      root.innerHTML = `<button class="launch" data-open aria-label="Mở SPX Tools" title="SPX Tools">${APP_ICON_URL ? `<img class="launch-icon" src="${esc(APP_ICON_URL)}" alt="">` : icon("app",20)}</button>`;
      return;
    }

    if (state.activeTab === "pickup") {
      root.innerHTML = `<div class="app">
        ${appHeaderHtml()}
        ${drawerHtml()}
        <main class="ops-main">
          <section class="ops-page">
            ${pageHeaderHtml("pickup")}
            ${renderPickupTab()}
          </section>
        </main>
      </div>`;
      return;
    }

    if (state.activeTab === "delivery") {
      root.innerHTML = `<div class="app">
        ${appHeaderHtml()}
        ${drawerHtml()}
        <main class="ops-main">
          <section class="ops-page">
            ${pageHeaderHtml("delivery")}
            ${renderDeliveryTab()}
          </section>
        </main>
        ${renderDeliveryPreviewModal()}
      </div>`;
      return;
    }

    if (state.activeTab === "delivery-month") {
      root.innerHTML = `<div class="app">
        ${appHeaderHtml()}
        ${drawerHtml()}
        <main class="ops-main">
          <section class="ops-page">
            ${pageHeaderHtml("delivery-month")}
            ${renderDeliveryMonthTab()}
          </section>
        </main>
      </div>`;
      return;
    }

    root.innerHTML = `<div class="app">
      ${appHeaderHtml()}
      ${drawerHtml()}
      <main class="ops-main">
        <section class="ops-page">
          ${pageHeaderHtml("fms")}
          <section class="card fms-filter-card">
            <div class="cardhead"><div class="cardtitle">Bộ lọc</div><span>${state.selectedStatuses.length?state.selectedStatuses.length+" status":"Tất cả status"}</span></div>
            <div class="query">
              <div class="field"><label class="label">Current Station</label><select class="select" data-current><option value="1030" ${state.currentStation==="1030"?"selected":""}>1030 - Pleiku SOC</option><option value="1812" ${state.currentStation==="1812"?"selected":""}>1812 - Pleiku 03 Hub</option></select></div>
              <div class="arrow">${icon("arrowRight",18)}</div>
              <div class="field"><label class="label">Next Station</label><select class="select" data-next-station><option value="1030" ${state.nextStation==="1030"?"selected":""}>1030 - Pleiku SOC</option><option value="1812" ${state.nextStation==="1812"?"selected":""}>1812 - Pleiku 03 Hub</option></select></div>
              <div class="field"><label class="label">Order Status cần lấy</label><button class="pick" data-picker><span>${state.selectedStatuses.length?state.selectedStatuses.length+" trạng thái đã chọn":"Tất cả trạng thái"}</span>${icon("chevronDown",16)}</button>${pickerHtml()}</div>
              <button class="primary" data-load ${state.loading||!state.bridgeReady?"disabled":""}>${state.loading?"Đang tải...":icon("refresh",16)+"<span>Tải dữ liệu</span>"}</button>
            </div>
          </section>
          ${state.progress?`<div class="progress" style="margin-top:12px">${esc(state.progress)}</div>`:""}
          ${state.error?`<div class="error" style="margin-top:12px">${esc(state.error)}</div>`:""}
          <div style="margin-top:12px">${tableHtml()}</div>
        </section>
      </main>
    </div>`;
  }

  window.addEventListener("message", event => {
    if (event.source !== window) return;
    const d = event.data;
    if (!d || d.source !== "SPX_FMS_AUDIT_BRIDGE") return;

    if (d.type === "SPX_FMS_BRIDGE_READY") { state.bridgeReady=true; render(); return; }

    if (String(d.type || "").startsWith("SPX_PICKUP_ASSIGNMENT_")) {
      if (d.requestId && d.requestId !== state.pickup.requestId) return;

      if (d.type === "SPX_PICKUP_ASSIGNMENT_PROGRESS") {
        if (d.stage === "search") {
          state.pickup.progress = "Đang tải danh sách Assigned: " + (d.ordersFound || 0) + "/" + (d.total || "?") + " · " + (d.pagesFetched || 0) + " trang";
        } else if (d.stage === "detail") {
          state.pickup.progress = "Đang lấy địa chỉ & tài xế: " + (d.completed || 0) + "/" + (d.total || 0);
        }
        render();
        return;
      }

      if (d.type === "SPX_PICKUP_ASSIGNMENT_RESULT") {
        const p = state.pickup;
        p.progress = "Đang cập nhật bộ nhớ địa chỉ...";
        persistPickupAddressCache(d.result?.rows, p.addressCache).then((rows) => {
          if (d.requestId && d.requestId !== p.requestId) return;
          p.loading = false;
          p.progress = "";
          p.error = "";
          p.addressCache = {};
          p.rows = normalizePickupRows(rows);
          p.total = Number(d.result?.assigned_count || p.rows.length);
          p.page = 1;
          render();
        });
        return;
      }

      if (d.type === "SPX_PICKUP_ASSIGNMENT_ERROR") {
        state.pickup.loading = false;
        state.pickup.progress = "";
        state.pickup.error = String(d.message || "Không thể tải Pickup Assignment.");
        render();
        return;
      }

      if (d.type === "SPX_PICKUP_ASSIGNMENT_CANCELLED") {
        state.pickup.loading = false;
        state.pickup.progress = "";
        render();
        return;
      }
    }

    if (String(d.type || "").startsWith("SPX_DELIVERY_EXPORT_")) {
      const deliveryState = d.reportType === "month" ? state.deliveryMonth : state.delivery;
      if (d.requestId && d.requestId !== deliveryState.requestId) return;

      if (d.type === "SPX_DELIVERY_EXPORT_PROGRESS") {
        if (d.stage === "create") {
          deliveryState.progress = "Đang tạo export task cho " + (d.startDate || deliveryState.startDate || deliveryState.startMonth) + "...";
        } else if (d.stage === "task-created") {
          deliveryState.taskId = Number(d.taskId || 0);
          deliveryState.progress = "Đã tạo task #" + deliveryState.taskId + " · đang chờ SPX tạo file...";
        } else if (d.stage === "poll") {
          deliveryState.progress = "Đang chờ file export · lần kiểm tra " + (d.attempt || 0) + "/" + (d.maxAttempts || 60);
        } else if (d.stage === "download") {
          deliveryState.progress = "File đã sẵn sàng · đang tải CSV vào bộ nhớ tạm...";
        }
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_RESULT") {
        const result = d.result || {};
        const report = d.reportType === "month"
          ? buildMonthlyDeliveryReport(result.csv_text || "")
          : buildDeliveryReport(result.csv_text || "");

        deliveryState.loading = false;
        deliveryState.progress = "";
        deliveryState.error = "";
        deliveryState.taskId = Number(result.task_id || 0);
        deliveryState.fileName = String(result.file_name || "");
        deliveryState.rows = report.rows;
        deliveryState.totals = report.totals;
        if (d.reportType !== "month") {
          deliveryState.stationName = String(result.station_name || "44-GLI Pleiku 03 Hub");
          deliveryState.csvText = String(result.csv_text || "");
          deliveryState.previewDataUrl = "";
          deliveryState.previewOpen = false;
        }
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_ERROR") {
        deliveryState.loading = false;
        deliveryState.progress = "";
        deliveryState.error = String(d.message || "Không thể export Delivery Performance.");
        render();
        return;
      }

      if (d.type === "SPX_DELIVERY_EXPORT_CANCELLED") {
        deliveryState.loading = false;
        deliveryState.progress = "";
        render();
        return;
      }
    }

    if (d.requestId && d.requestId !== state.requestId) return;

    if (d.type === "SPX_FMS_PROGRESS") {
      if (d.stage==="search") state.progress=`Search: ${d.ordersFound||0}/${d.total||"?"} · ${d.pagesFetched||0} trang`;
      if (d.stage==="detail") state.progress=`Tracking detail: ${d.completed||0}/${d.total||0}`;
      render(); return;
    }
    if (d.type === "SPX_FMS_RESULT") {
      state.rows=normalizeRows(d.result?.rows); state.total=Math.max(Number(d.result?.total||0),state.rows.length);
      state.applied={current:stationName(state.currentStation),next:stationName(state.nextStation),statuses:state.selectedStatuses.slice()};
      state.loading=false; state.progress=""; state.error=""; state.orderStatus="ALL"; state.page=1; render(); return;
    }
    if (d.type === "SPX_FMS_ERROR") { state.loading=false; state.progress=""; state.error=String(d.message||"Không thể tải FMS."); render(); return; }
    if (d.type === "SPX_FMS_CANCELLED") { state.loading=false; state.progress=""; render(); }
  });

  shadow.addEventListener("click", e => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;

    // IMPORTANT:
    // Sau khi UI dùng inline SVG, event.target thường là <svg>, <path> hoặc <span>.
    // Vì vậy mọi button/action phải resolve bằng closest() thay vì matches() trực tiếp.
    const openButton = t.closest("[data-open]");
    if (openButton) {
      state.open = true;
      state.drawerOpen = false;
      render();
      return;
    }

    const menuOpenButton = t.closest("[data-menu-open]");
    if (menuOpenButton) {
      state.drawerOpen = true;
      render();
      return;
    }

    const menuCloseButton = t.closest("[data-menu-close]");
    if (menuCloseButton) {
      state.drawerOpen = false;
      render();
      return;
    }

    // Chỉ click trực tiếp vào vùng backdrop mới đóng drawer.
    // Click bên trong drawer-panel không được bubble thành hành động close.
    if (
      t.matches("[data-menu-overlay]") &&
      !t.closest(".drawer-panel")
    ) {
      state.drawerOpen = false;
      render();
      return;
    }

    const navTarget = t.closest("[data-nav]");
    if (navTarget) {
      state.activeTab = navTarget.dataset.nav || "fms";
      state.drawerOpen = false;
      state.picker = false;
      render();
      return;
    }

    const legacyTab = t.closest("[data-tab]");
    if (legacyTab) {
      state.activeTab = legacyTab.dataset.tab || "fms";
      state.picker = false;
      render();
      return;
    }

    const closeButton = t.closest("[data-close]");
    if (closeButton) {
      state.drawerOpen = false;
      state.picker = false;
      state.delivery.previewOpen = false;
      state.open = false;
      state.embedded = false;
      host.removeAttribute("data-spx-embedded");
      window.dispatchEvent(new Event("SPX_OPS_CLOSED"));
      render();
      return;
    }

    const pickerButton = t.closest("[data-picker]");
    if (pickerButton) {
      state.picker = !state.picker;
      render();
      return;
    }

    const loadButton = t.closest("[data-load]");
    if (loadButton) {
      state.picker = false;
      load();
      return;
    }

    const prevButton = t.closest("button[data-prev]");
    if (prevButton) {
      state.page = Math.max(1, state.page - 1);
      render();
      return;
    }

    const nextButton = t.closest("button[data-next]");
    if (nextButton) {
      state.page += 1;
      render();
      return;
    }

    const pickupLoadButton = t.closest("[data-pickup-load]");
    if (pickupLoadButton) {
      requestPickupAssignment();
      return;
    }

    const pickupCancelButton = t.closest("[data-pickup-cancel]");
    if (pickupCancelButton) {
      cancelPickupAssignment();
      return;
    }

    const pickupPrevButton = t.closest("[data-pickup-prev]");
    if (pickupPrevButton && !pickupPrevButton.disabled) {
      state.pickup.page = Math.max(1, state.pickup.page - 1);
      render();
      return;
    }

    const pickupNextButton = t.closest("[data-pickup-next]");
    if (pickupNextButton && !pickupNextButton.disabled) {
      state.pickup.page += 1;
      render();
      return;
    }

    const deliveryRunButton = t.closest("[data-delivery-run]");
    if (deliveryRunButton) {
      requestDeliveryExport();
      return;
    }

    const deliveryMonthRunButton = t.closest("[data-delivery-month-run]");
    if (deliveryMonthRunButton) {
      requestDeliveryMonthExport();
      return;
    }

    const deliveryMonthCancelButton = t.closest("[data-delivery-month-cancel]");
    if (deliveryMonthCancelButton) {
      cancelDeliveryMonthExport();
      return;
    }

    const deliveryCancelButton = t.closest("[data-delivery-cancel]");
    if (deliveryCancelButton) {
      cancelDeliveryExport();
      return;
    }

    const deliveryPreviewButton = t.closest("[data-delivery-preview]");
    if (deliveryPreviewButton) {
      state.delivery.previewDataUrl = createDeliveryJpegPreview();
      state.delivery.previewOpen = Boolean(state.delivery.previewDataUrl);
      render();
      return;
    }

    const deliveryDownloadButton = t.closest("[data-delivery-download-jpg]");
    if (deliveryDownloadButton) {
      const dataUrl =
        state.delivery.previewDataUrl ||
        createDeliveryJpegPreview();

      if (!dataUrl) return;

      state.delivery.previewDataUrl = dataUrl;

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download =
        "delivery_performance_" +
        state.delivery.startDate +
        ".jpg";

      a.click();
      return;
    }

    // Modal preview:
    // - click nút X => đóng
    // - click trực tiếp backdrop => đóng
    // - click nội dung bên trong modal => KHÔNG đóng
    const previewCloseButton =
      t.closest("button[data-preview-close]");

    if (previewCloseButton) {
      state.delivery.previewOpen = false;
      render();
      return;
    }

    if (
      t.matches(".preview-backdrop[data-preview-close]")
    ) {
      state.delivery.previewOpen = false;
      render();
    }
  });

  shadow.addEventListener("change", e => {
    const t=e.target;
    if (t.matches("[data-pickup-start-date]")) { state.pickup.startDate=t.value; return; }
    if (t.matches("[data-pickup-end-date]")) { state.pickup.endDate=t.value; return; }
    if (t.matches("[data-pickup-driver-filter]")) { state.pickup.driverFilter=t.value || "ALL"; state.pickup.page=1; render(); return; }
    if (t.matches("[data-delivery-date]")) { state.delivery.startDate=t.value; return; }
    if (t.matches("[data-delivery-month]")) { state.deliveryMonth.startMonth=t.value; return; }
    if (t.matches("[data-current]")) { state.currentStation=t.value; render(); return; }
    if (t.matches("[data-next-station]")) { state.nextStation=t.value; render(); return; }
    if (t.matches("[data-all]")) { state.selectedStatuses=[]; render(); return; }
    if (t.matches("[data-status]")) {
      const c=String(t.dataset.status); const i=state.selectedStatuses.indexOf(c);
      if (t.checked && i<0) state.selectedStatuses.push(c);
      if (!t.checked && i>=0) state.selectedStatuses.splice(i,1);
      state.selectedStatuses.sort((a,b)=>Number(a)-Number(b)); render(); return;
    }
    if (t.matches("[data-aging]")) { state.aging=t.value; state.page=1; render(); return; }
    if (t.matches("[data-order-status]")) { state.orderStatus=t.value; state.page=1; render(); }
  });

  shadow.addEventListener("input", e => {
    const target = e.target;

    if (target.matches("[data-status-search]")) {
      state.statusSearch = target.value;
      const pos = target.selectionStart;
      render();
      const next = shadow.querySelector("[data-status-search]");
      if (next) { next.focus(); next.setSelectionRange(pos, pos); }
      return;
    }

    if (!target.matches("[data-search]")) return;
    state.search = target.value;
    state.page = 1;
    const pos = target.selectionStart;
    render();
    const next = shadow.querySelector("[data-search]");
    if (next) { next.focus(); next.setSelectionRange(pos, pos); }
  });

  // SeaTalk delivery-report integration (v1.4.0)
  Object.assign(state.delivery, {
    seatalkWebhook: "",
    seatalkLoaded: false,
    seatalkSending: false,
    seatalkMessage: "",
    seatalkError: ""
  });

  function seatalkValidWebhook(value) {
    try {
      const url = new URL(String(value || "").trim());
      return url.protocol === "https:" &&
        url.hostname === "openapi.seatalk.io" &&
        url.pathname.startsWith("/webhook/group/");
    } catch (_) {
      return false;
    }
  }

  function seatalkLoadWebhook() {
    if (!globalThis.chrome?.storage?.local) {
      state.delivery.seatalkLoaded = true;
      return;
    }

    chrome.storage.local.get(["seatalkWebhook"], result => {
      state.delivery.seatalkWebhook = String(result?.seatalkWebhook || "");
      state.delivery.seatalkLoaded = true;
      render();
    });
  }

  function seatalkSaveWebhook() {
    const input = shadow.querySelector("[data-seatalk-webhook]");
    const value = String(input?.value || "").trim();

    state.delivery.seatalkMessage = "";
    state.delivery.seatalkError = "";

    if (!value) {
      seatalkClearWebhook();
      return;
    }

    if (!seatalkValidWebhook(value)) {
      state.delivery.seatalkError =
        "Webhook không hợp lệ. Chỉ chấp nhận https://openapi.seatalk.io/webhook/group/...";
      render();
      return;
    }

    chrome.storage.local.set({seatalkWebhook: value}, () => {
      if (chrome.runtime.lastError) {
        state.delivery.seatalkError = chrome.runtime.lastError.message;
      } else {
        state.delivery.seatalkWebhook = value;
        state.delivery.seatalkMessage = "Đã lưu SeaTalk Webhook trên thiết bị này.";
      }
      render();
    });
  }

  function seatalkClearWebhook() {
    chrome.storage.local.remove("seatalkWebhook", () => {
      state.delivery.seatalkWebhook = "";
      state.delivery.seatalkError = "";
      state.delivery.seatalkMessage = "Đã xóa SeaTalk Webhook khỏi bộ nhớ local.";
      render();
    });
  }

  function seatalkSendDeliveryImage() {
    const d = state.delivery;
    if (d.seatalkSending) return;

    d.seatalkMessage = "";
    d.seatalkError = "";

    if (!seatalkValidWebhook(d.seatalkWebhook)) {
      d.seatalkError = "Hãy nhập và lưu SeaTalk Webhook trước khi gửi.";
      render();
      return;
    }

    const dataUrl = d.previewDataUrl || createDeliveryJpegPreview();
    if (!dataUrl) {
      d.seatalkError = "Chưa có Delivery Performance report để gửi.";
      render();
      return;
    }

    const base64 = String(dataUrl).split(",", 2)[1] || "";
    const encodedBytes = new TextEncoder().encode(base64).length;

    if (!base64 || encodedBytes > 5 * 1024 * 1024) {
      d.seatalkError = "Ảnh report vượt giới hạn 5MB Base64 của SeaTalk.";
      render();
      return;
    }

    d.previewDataUrl = dataUrl;
    d.seatalkSending = true;
    d.seatalkMessage = "Đang gửi ảnh report vào SeaTalk...";
    render();

    chrome.runtime.sendMessage({
      type: "SEATALK_SEND_IMAGE",
      webhook: d.seatalkWebhook,
      imageBase64: base64
    }, response => {
      d.seatalkSending = false;

      if (chrome.runtime.lastError) {
        d.seatalkMessage = "";
        d.seatalkError = chrome.runtime.lastError.message;
        render();
        return;
      }

      if (!response?.ok) {
        d.seatalkMessage = "";
        d.seatalkError = String(response?.error || "SeaTalk webhook gửi thất bại.");
        render();
        return;
      }

      d.seatalkError = "";
      d.seatalkMessage = "Đã gửi ảnh Delivery Performance vào SeaTalk.";
      render();
    });
  }

  function seatalkEnsureStyles() {
    if (shadow.querySelector("#seatalk-addon-style")) return;

    const extraStyle = document.createElement("style");
    extraStyle.id = "seatalk-addon-style";
    extraStyle.textContent = [
      ".seatalk-config{margin:0 14px 14px;padding:12px;border:1px solid #dfe4e9;border-radius:11px;background:#f8fafb;display:grid;gap:8px}",
      ".seatalk-config-head{display:flex;align-items:center;justify-content:space-between;gap:10px}",
      ".seatalk-config-title{font-size:10.5px;font-weight:900;color:#374151}",
      ".seatalk-local{font-size:9px;color:#76808b}",
      ".seatalk-row{display:grid;grid-template-columns:minmax(360px,1fr) auto auto;gap:8px;align-items:center}",
      ".seatalk-message{font-size:9.5px;font-weight:800;color:#167653}",
      ".seatalk-error{font-size:9.5px;font-weight:800;color:#a52b49}",
      ".seatalk-send{border-color:#bfd4f3!important;background:#eef5ff!important;color:#2459a9!important}",
      ".seatalk-send:disabled{opacity:.5;cursor:not-allowed}",
      "@media(max-width:900px){.seatalk-row{grid-template-columns:1fr}.seatalk-config-head{align-items:flex-start;flex-direction:column}}"
    ].join("");

    shadow.appendChild(extraStyle);
  }

  function seatalkEnhanceUI() {
    seatalkEnsureStyles();

    if (!state.open || state.activeTab !== "delivery") return;

    const form = shadow.querySelector(".delivery-form");
    if (form && !shadow.querySelector("[data-seatalk-config]")) {
      const config = document.createElement("div");
      config.className = "seatalk-config";
      config.setAttribute("data-seatalk-config", "");

      config.innerHTML = `
        <div class="seatalk-config-head">
          <div class="seatalk-config-title icon-label">${icon("link",15)}<span>SeaTalk Webhook</span></div>
        </div>
        <div class="seatalk-row">
          <input
            class="input"
            type="password"
            autocomplete="off"
            spellcheck="false"
            data-seatalk-webhook
            placeholder="https://openapi.seatalk.io/webhook/group/..."
            value="${esc(state.delivery.seatalkWebhook)}"
          >
          <button class="ghostbtn" data-seatalk-save>${icon("save",15)}<span>Lưu webhook</span></button>
          <button class="ghostbtn" data-seatalk-clear ${state.delivery.seatalkWebhook ? "" : "disabled"}>${icon("trash",15)}<span>Xóa</span></button>
        </div>
        ${state.delivery.seatalkMessage ? `<div class="seatalk-message">${esc(state.delivery.seatalkMessage)}</div>` : ""}
        ${state.delivery.seatalkError ? `<div class="seatalk-error">${esc(state.delivery.seatalkError)}</div>` : ""}
      `;

      form.insertAdjacentElement("afterend", config);
    }

    const previewButton = shadow.querySelector("[data-delivery-preview]");
    if (previewButton && !shadow.querySelector("[data-delivery-seatalk]")) {
      const sendButton = document.createElement("button");
      sendButton.className = "ghostbtn seatalk-send";
      sendButton.setAttribute("data-delivery-seatalk", "");
      sendButton.disabled = !state.delivery.seatalkWebhook || state.delivery.seatalkSending;
      sendButton.innerHTML = state.delivery.seatalkSending ? "Đang gửi..." : icon("send",15) + "<span>Gửi SeaTalk</span>";
      previewButton.insertAdjacentElement("afterend", sendButton);
    }
  }

  const seatalkBaseRender = render;
  render = function () {
    seatalkBaseRender();
    seatalkEnhanceUI();
  };

  shadow.addEventListener("click", event => {
    const target = event.target.closest(
      "[data-seatalk-save],[data-seatalk-clear],[data-delivery-seatalk]"
    );

    if (!target) return;

    if (target.matches("[data-seatalk-save]")) {
      seatalkSaveWebhook();
      return;
    }

    if (target.matches("[data-seatalk-clear]")) {
      seatalkClearWebhook();
      return;
    }

    if (target.matches("[data-delivery-seatalk]")) {
      seatalkSendDeliveryImage();
    }
  });

  render();
  seatalkLoadWebhook();
  post("SPX_FMS_PING");
})();

// ---- SPX native sidebar menu ----

(() => {
  "use strict";
  if (window.__SPX_OPS_MENU_SCRIPT__) return;
  window.__SPX_OPS_MENU_SCRIPT__ = true;

  const ID = "spx-ops-native-menu";
  const items = [
    ["fms", "FMS Audit"],
    ["delivery", "Delivery Performance"],
    ["delivery-month", "Delivery Performance (Month)"],
    ["pickup", "Pickup Assignment"]
  ];
  let menu = null;
  let expanded = false;
  let active = "";
  let queued = false;

  function installStyle() {
    if (document.getElementById("spx-ops-menu-style") || !document.head) return;
    const style = document.createElement("style");
    style.id = "spx-ops-menu-style";
    style.textContent = [
      "#" + ID + "{list-style:none;border-top:1px solid transparent;border-bottom:1px solid transparent;color:rgba(255,255,255,.7)}",
      "#" + ID + ">.ssc-menu-submenu-title{min-height:44px;display:flex;align-items:center;gap:12px;padding:0 14px;cursor:pointer;color:inherit}",
      "#" + ID + " .title-icon{width:24px;height:24px;flex-shrink:0}",
      "#" + ID + " .sub-menu-title{flex:1}",
      "#" + ID + " .submenu-icon{width:20px;height:20px;transition:transform .15s}",
      "#" + ID + ".ssc-menu-opened .submenu-icon{transform:rotate(180deg)}",
      "#" + ID + ">ul.ssc-menu{list-style:none;margin:0;padding:0;background:#0e1723}",
      "#" + ID + " button.ssc-menu-item{display:block;box-sizing:border-box;width:100%;min-height:40px;border:0;border-radius:0;padding:10px 10px 10px 44px;background:transparent;text-align:left;color:rgba(255,255,255,.7);font:inherit;font-size:14px;cursor:pointer}",
      "#" + ID + " button.ssc-menu-item:hover{background:rgba(255,255,255,.08);color:#fff}",
      "#" + ID + " button.ssc-menu-item.ssc-menu-item-active{background:#ee4d2d;color:#fff}",
      "#" + ID + " button:focus-visible,#" + ID + " [role=button]:focus-visible{outline:2px solid #ee4d2d;outline-offset:-2px}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function outboundMenu() {
    for (const li of document.querySelectorAll("li.ssc-menu-submenu")) {
      if (li.id === ID || li.closest("#" + ID)) continue;
      const label = li.querySelector(":scope > .ssc-menu-submenu-title > .sub-menu-title");
      if (label?.textContent.trim() === "Outbound") return li;
    }
    return null;
  }

  function redraw() {
    if (!menu?.isConnected) return;
    menu.classList.toggle("ssc-menu-opened", expanded);
    menu.style.background = expanded ? "#0e1723" : "";
    const title = menu.querySelector(":scope > .ssc-menu-submenu-title");
    const list = menu.querySelector(":scope > ul.ssc-menu");
    title?.setAttribute("aria-expanded", String(expanded));
    if (list) list.style.display = expanded ? "block" : "none";
    menu.querySelectorAll("[data-spx-tool]").forEach(button => {
      const current = button.dataset.spxTool === active;
      button.classList.toggle("ssc-menu-item-active", current);
      if (current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function createMenu() {
    const li = document.createElement("li");
    li.id = ID;
    li.className = "submenu ssc-menu-submenu";
    const title = document.createElement("div");
    title.className = "ssc-menu-submenu-title";
    title.tabIndex = 0;
    title.setAttribute("role", "button");
    title.setAttribute("aria-label", "Uyển Ni");
    title.innerHTML =
      '<svg class="title-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(72 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(144 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(216 12 12)"/><path d="M12 3c1.9 0 3.1 1.4 3.1 3.3 0 2.1-1.7 4.4-3.1 5.7-1.4-1.3-3.1-3.6-3.1-5.7C8.9 4.4 10.1 3 12 3z" transform="rotate(288 12 12)"/><circle cx="12" cy="12" r="2" fill="#0e1723"/></svg>' +
      '<span class="sub-menu-title">Uyển Ni</span>' +
      '<span class="ssc-menu-submenu-title-icon"><svg class="submenu-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m7 10 5 5 5-5-1.4-1.4L12 12.2 8.4 8.6z"/></svg></span>';
    const list = document.createElement("ul");
    list.className = "ssc-menu";
    items.forEach(([tab, label]) => {
      const wrapper = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "submenu-item ssc-menu-item";
      button.dataset.spxTool = tab;
      button.textContent = label;
      wrapper.appendChild(button);
      list.appendChild(wrapper);
    });
    li.append(title, list);
    function toggle(event) {
      event.preventDefault();
      event.stopPropagation();
      expanded = !expanded;
      redraw();
    }
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") toggle(event);
    });
    list.addEventListener("click", event => {
      const button = event.target instanceof Element ? event.target.closest("[data-spx-tool]") : null;
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      active = button.dataset.spxTool;
      expanded = true;
      redraw();
      window.dispatchEvent(new CustomEvent("SPX_OPS_OPEN", {detail:{tab:active}}));
    });
    return li;
  }

  function attach() {
    queued = false;
    if (menu?.isConnected) return;
    const anchor = outboundMenu();
    if (!anchor?.parentElement) return;
    installStyle();
    menu = document.getElementById(ID) || createMenu();
    anchor.insertAdjacentElement("afterend", menu);
    redraw();
    window.dispatchEvent(new Event("SPX_OPS_MENU_READY"));
  }

  function queueAttach() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(attach);
  }
  new MutationObserver(() => {
    if (!menu?.isConnected) queueAttach();
  }).observe(document.documentElement, {childList:true, subtree:true});
  queueAttach();

  function closeOnNativeNavigation() {
    if (!active) return;
    active = "";
    redraw();
    window.dispatchEvent(new Event("SPX_OPS_NATIVE_NAV"));
  }
  document.addEventListener("click", event => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (anchor && !anchor.closest("#" + ID)) closeOnNativeNavigation();
  }, true);
  window.addEventListener("hashchange", closeOnNativeNavigation);
  window.addEventListener("SPX_OPS_CLOSED", () => {
    active = "";
    redraw();
  });
})();
