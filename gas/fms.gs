var FMS_SEARCH_URL = "https://spx.shopee.vn/api/fleet_order/order/tracking_list/search";
var FMS_TRACKING_URL = "https://spx.shopee.vn/api/fleet_order/order/detail/tracking_info";
var FMS_SEARCH_PAGE_SIZE = 50;
var FMS_SEARCH_PAGE_DELAY_MS = 250;
var FMS_MAX_SEARCH_PAGES = 100;
var FMS_DETAIL_BATCH_SIZE = 5;
var FMS_DETAIL_BATCH_DELAY_MS = 1000;
var FMS_CURRENT_STATION_IDS = "1030";
var FMS_NEXT_STATION_IDS = "1812";
var FMS_ORDER_STATUS = "880,36,15";

function requireFmsAccess_() {
  var access = getCurrentUserAccess_();
  if (!access.allowed) {
    throw new Error("Bạn không có quyền sử dụng dữ liệu FMS.");
  }
}

function extractCookieValue_(cookie, name) {
  var source = String(cookie || "");
  var parts = source.split(";");

  for (var index = 0; index < parts.length; index += 1) {
    var pair = parts[index].trim();
    var separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;

    var key = pair.slice(0, separatorIndex).trim();
    if (key !== name) continue;
    return pair.slice(separatorIndex + 1).trim();
  }

  return "";
}

function buildFmsHeaders_(cookie) {
  var headers = {
    "Cookie": cookie,
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36"
  };

  var csrfToken =
    extractCookieValue_(cookie, "csrftoken") ||
    extractCookieValue_(cookie, "csrf_token");

  if (csrfToken) {
    headers["x-csrftoken"] = csrfToken;
  }

  return headers;
}

function parseFmsResponse_(response, label) {
  var responseCode = response.getResponseCode();
  var content = response.getContentText();
  var parsed;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(label + " trả về dữ liệu không hợp lệ (HTTP " + responseCode + ").");
  }

  if (responseCode === 401 || responseCode === 403) {
    throw new Error("SPX Cookie đã hết hạn hoặc không có quyền truy cập FMS.");
  }

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(label + " thất bại (HTTP " + responseCode + ").");
  }

  if (parsed && typeof parsed.retcode !== "undefined" && Number(parsed.retcode) !== 0) {
    throw new Error(parsed.message || (label + " trả về retcode " + parsed.retcode + "."));
  }

  return parsed;
}

function findLatestFmsTracking_(items, latest) {
  if (!Array.isArray(items)) return latest;

  items.forEach(function (item) {
    if (!item || typeof item !== "object") return;

    var candidate = {
      id: Number(item.id || 0),
      status: Number(item.status || 0),
      timestamp: Number(item.timestamp || 0),
      message: String(item.message || ""),
      station_name: String(item.station_name || "")
    };

    if (!latest || candidate.timestamp > Number(latest.timestamp || 0)) {
      latest = candidate;
    }

    latest = findLatestFmsTracking_(item.children, latest);
    latest = findLatestFmsTracking_(item.event_children, latest);
  });

  return latest;
}

function getFmsLatestTrackingEvent_(response) {
  var parsed = parseFmsResponse_(response, "Tracking detail");
  var trackingList =
    parsed && parsed.data && Array.isArray(parsed.data.tracking_list)
      ? parsed.data.tracking_list
      : [];

  return findLatestFmsTracking_(trackingList, null);
}

function buildFmsSearchPayload_(pageNo) {
  return {
    count: FMS_SEARCH_PAGE_SIZE,
    current_station_ids: FMS_CURRENT_STATION_IDS,
    next_station_ids: FMS_NEXT_STATION_IDS,
    order_status: FMS_ORDER_STATUS,
    page_no: pageNo
  };
}

function fetchAllFmsOrders_(headers) {
  var orders = [];
  var seenShipmentIds = {};
  var total = 0;
  var rawFetched = 0;
  var pagesFetched = 0;
  var shouldContinue = true;

  for (var pageNo = 1; pageNo <= FMS_MAX_SEARCH_PAGES && shouldContinue; pageNo += 1) {
    var response = UrlFetchApp.fetch(FMS_SEARCH_URL, {
      method: "post",
      headers: headers,
      contentType: "application/json",
      payload: JSON.stringify(buildFmsSearchPayload_(pageNo)),
      muteHttpExceptions: true
    });

    var json = parseFmsResponse_(response, "FMS search page " + pageNo);
    var data = json && json.data ? json.data : {};
    var pageOrders = Array.isArray(data.list) ? data.list : [];
    var declaredTotal = Number(data.total || 0);

    pagesFetched = pageNo;
    total = Math.max(total, declaredTotal);
    rawFetched += pageOrders.length;

    pageOrders.forEach(function (order, index) {
      var shipmentId = String(order && order.shipment_id || "").trim();
      var dedupeKey = shipmentId || ("__missing__" + pageNo + "_" + index);

      if (seenShipmentIds[dedupeKey]) return;
      seenShipmentIds[dedupeKey] = true;
      orders.push(order);
    });

    var hasMoreByTotal = total > rawFetched;
    var hasMoreWithoutTotal = total <= 0 && pageOrders.length >= FMS_SEARCH_PAGE_SIZE;
    shouldContinue = pageOrders.length > 0 && (hasMoreByTotal || hasMoreWithoutTotal);

    if (shouldContinue && pageNo < FMS_MAX_SEARCH_PAGES) {
      Utilities.sleep(FMS_SEARCH_PAGE_DELAY_MS);
    }
  }

  if (shouldContinue && pagesFetched >= FMS_MAX_SEARCH_PAGES) {
    throw new Error("FMS search vượt quá giới hạn an toàn " + FMS_MAX_SEARCH_PAGES + " trang.");
  }

  return {
    orders: orders,
    total: Math.max(total, orders.length),
    pages_fetched: pagesFetched
  };
}

function buildFmsDetailRequest_(shipmentId, headers) {
  return {
    url: FMS_TRACKING_URL + "?shipment_id=" + encodeURIComponent(shipmentId),
    method: "get",
    headers: headers,
    muteHttpExceptions: true
  };
}

function buildFmsRow_(order, latestTrackingEvent, trackingError) {
  return {
    shipment_id: String(order && order.shipment_id || ""),
    current_to_number: String(order && order.current_to_number || ""),
    order_status: Number(order && order.order_status || 0),
    bulky_type: Number(order && order.bulky_type || 0),
    current_station_name: String(order && order.current_station_name || ""),
    next_station_name: String(order && order.next_station_name || ""),
    latest_tracking_event: latestTrackingEvent,
    tracking_error: trackingError
  };
}

function fetchFmsLatestTrackingInBatches_(orders, headers) {
  var rows = new Array(orders.length);

  for (var start = 0; start < orders.length; start += FMS_DETAIL_BATCH_SIZE) {
    var end = Math.min(start + FMS_DETAIL_BATCH_SIZE, orders.length);
    var requestEntries = [];

    for (var index = start; index < end; index += 1) {
      var order = orders[index];
      var shipmentId = String(order && order.shipment_id || "").trim();

      if (!shipmentId) {
        rows[index] = buildFmsRow_(order, null, "Thiếu shipment_id.");
        continue;
      }

      requestEntries.push({
        index: index,
        order: order,
        request: buildFmsDetailRequest_(shipmentId, headers)
      });
    }

    if (requestEntries.length) {
      var responses;

      try {
        responses = UrlFetchApp.fetchAll(requestEntries.map(function (entry) {
          return entry.request;
        }));
      } catch (error) {
        var batchError = error && error.message ? error.message : String(error || "");
        requestEntries.forEach(function (entry) {
          rows[entry.index] = buildFmsRow_(entry.order, null, batchError);
        });
        responses = [];
      }

      requestEntries.forEach(function (entry, responseIndex) {
        if (rows[entry.index]) return;

        var latestTrackingEvent = null;
        var trackingError = "";

        try {
          latestTrackingEvent = getFmsLatestTrackingEvent_(responses[responseIndex]);
        } catch (error) {
          trackingError = error && error.message ? error.message : String(error || "");
        }

        rows[entry.index] = buildFmsRow_(entry.order, latestTrackingEvent, trackingError);
      });
    }

    if (end < orders.length) {
      Utilities.sleep(FMS_DETAIL_BATCH_DELAY_MS);
    }
  }

  return rows.filter(function (row) {
    return Boolean(row);
  });
}

function getFmsData(cookie, pageNo) {
  requireFmsAccess_();

  var normalizedCookie = String(cookie || "").trim();
  if (!normalizedCookie) {
    throw new Error("Chưa có SPX Cookie. Hãy nhập Cookie trong tab Cookie.");
  }

  var headers = buildFmsHeaders_(normalizedCookie);

  // Pha 1: lấy toàn bộ danh sách FMS, mỗi request 50 đơn.
  var searchResult = fetchAllFmsOrders_(headers);

  // Pha 2: chỉ sau khi lấy xong toàn bộ đơn mới gọi tracking detail theo batch nhỏ.
  var rows = fetchFmsLatestTrackingInBatches_(searchResult.orders, headers);
  var total = Math.max(searchResult.total, rows.length);

  return {
    page_no: 1,
    count: Math.max(1, total),
    total: total,
    rows: rows,
    search_pages_fetched: searchResult.pages_fetched,
    detail_batch_size: FMS_DETAIL_BATCH_SIZE
  };
}
