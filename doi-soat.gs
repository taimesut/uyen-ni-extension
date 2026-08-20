var DOI_SOAT_SHEET_NAME = "raw";
var DOI_SOAT_REQUIRED_HEADERS = [
  "trip_number",
  "to_number",
  "fleet_order_id",
  "bulky_type",
  "arrived_time",
  "last_status_tracking",
  "aging_group"
];
var DOI_SOAT_ALLOWED_AGING = {
  "24H -> 36H": true,
  "> 36H": true
};

function normalizeDoiSoatHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function getDoiSoatRaw() {
  var access = getCurrentUserAccess_();
  if (!access.allowed) {
    throw new Error("Bạn không có quyền sử dụng chức năng đối soát.");
  }

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(DOI_SOAT_SHEET_NAME);
  if (!sheet) {
    throw new Error('Không tìm thấy sheet "raw".');
  }

  var values = sheet.getDataRange().getDisplayValues();
  if (values.length === 0) {
    return { rows: [], total: 0, count24To36: 0, countOver36: 0 };
  }

  var headerIndexes = {};
  values[0].forEach(function (header, index) {
    var normalized = normalizeDoiSoatHeader_(header);
    if (normalized && headerIndexes[normalized] === undefined) {
      headerIndexes[normalized] = index;
    }
  });

  var missingHeaders = DOI_SOAT_REQUIRED_HEADERS.filter(function (header) {
    return headerIndexes[header] === undefined;
  });
  if (missingHeaders.length > 0) {
    throw new Error("Sheet raw thiếu cột: " + missingHeaders.join(", "));
  }

  var rows = values.slice(1).reduce(function (result, row) {
    var agingGroup = String(row[headerIndexes.aging_group] || "").trim();
    if (!DOI_SOAT_ALLOWED_AGING[agingGroup]) return result;

    result.push({
      trip_number: String(row[headerIndexes.trip_number] || "").trim(),
      to_number: String(row[headerIndexes.to_number] || "").trim(),
      fleet_order_id: String(row[headerIndexes.fleet_order_id] || "").trim(),
      bulky_type: String(row[headerIndexes.bulky_type] || "").trim(),
      arrived_time: String(row[headerIndexes.arrived_time] || "").trim(),
      last_status_tracking: String(row[headerIndexes.last_status_tracking] || "").trim(),
      aging_group: agingGroup
    });
    return result;
  }, []);

  return {
    rows: rows,
    total: rows.length,
    count24To36: rows.filter(function (row) { return row.aging_group === "24H -> 36H"; }).length,
    countOver36: rows.filter(function (row) { return row.aging_group === "> 36H"; }).length
  };
}
