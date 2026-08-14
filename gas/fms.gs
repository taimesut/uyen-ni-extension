var FMS_SEARCH_URL = "https://spx.shopee.vn/api/fleet_order/order/tracking_list/search";
var FMS_TRACKING_URL = "https://spx.shopee.vn/api/fleet_order/order/detail/tracking_info";
var FMS_PAGE_COUNT = 24;
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

function getFmsData(cookie, pageNo) {
  requireFmsAccess_();

  var normalizedCookie = String(cookie || "").trim();
  if (!normalizedCookie) {
    throw new Error("Chưa có SPX Cookie. Hãy nhập Cookie trong tab Cookie.");
  }

  var normalizedPageNo = Math.max(1, Math.floor(Number(pageNo) || 1));
  var headers = buildFmsHeaders_(normalizedCookie);
  var payload = {
    count: FMS_PAGE_COUNT,
    current_station_ids: FMS_CURRENT_STATION_IDS,
    next_station_ids: FMS_NEXT_STATION_IDS,
    order_status: FMS_ORDER_STATUS,
    page_no: normalizedPageNo
  };

  var searchResponse = UrlFetchApp.fetch(FMS_SEARCH_URL, {
    method: "post",
    headers: headers,
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var searchJson = parseFmsResponse_(searchResponse, "FMS search");
  var data = searchJson && searchJson.data ? searchJson.data : {};
  var orders = Array.isArray(data.list) ? data.list : [];

  var detailRequests = orders.map(function (order) {
    var shipmentId = String(order.shipment_id || "").trim();
    return {
      url: FMS_TRACKING_URL + "?shipment_id=" + encodeURIComponent(shipmentId),
      method: "get",
      headers: headers,
      muteHttpExceptions: true
    };
  });

  var detailResponses = detailRequests.length
    ? UrlFetchApp.fetchAll(detailRequests)
    : [];

  var rows = orders.map(function (order, index) {
    var latestTrackingEvent = null;
    var trackingError = "";

    try {
      latestTrackingEvent = getFmsLatestTrackingEvent_(detailResponses[index]);
    } catch (error) {
      trackingError = error && error.message ? error.message : String(error || "");
    }

    return {
      shipment_id: String(order.shipment_id || ""),
      current_to_number: String(order.current_to_number || ""),
      order_status: Number(order.order_status || 0),
      bulky_type: Number(order.bulky_type || 0),
      current_station_name: String(order.current_station_name || ""),
      next_station_name: String(order.next_station_name || ""),
      latest_tracking_event: latestTrackingEvent,
      tracking_error: trackingError
    };
  });

  return {
    page_no: Number(data.page_no || normalizedPageNo),
    count: Number(data.count || FMS_PAGE_COUNT),
    total: Number(data.total || 0),
    rows: rows
  };
}
